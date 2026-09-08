# CodeAstra — AI Analysis Layer: Implementation Explanation

> Written for the project review. This document explains how the AI layer of CodeAstra works — from a raw GitHub URL to a structured repository analysis (folder purposes, entry point, dependency map).

---

## 1. Big Picture: What the AI Layer Does

Given a **GitHub repository URL**, CodeAstra produces a structured JSON analysis with 3 modules:

| Module | Question it answers |
|--------|---------------------|
| **M1 — Folder Analysis** | What is each top-level folder for? (`logic`, `config`, `utility`, `test`, `entry`...) |
| **M2 — Entry Point Detection** | Where does the app start, and what happens at boot step-by-step? |
| **M3 — Dependency Map** | Which files import which? What is the critical dependency chain? |

The key design decision: **we did NOT make one giant "monolithic" LLM call.** Instead the analysis is split into **3 independent tasks that run in parallel** using **LangGraph**, and then an aggregation node merges them. This is the core thing to explain in the review.

---

## 2. Tech Stack of the AI Layer

```
@langchain/langgraph   → graph orchestration (StateGraph, parallel fan-out/fan-in)
@langchain/groq        → LLM provider (ChatGroq)
llama-3.3-70b-versatile → the model (fast + free tier at temperature 0)
zod                    → structured-output schemas (LLM output validation)
@octokit/rest          → fetching GitHub repo tree + file contents
mongoose               → persisting the final analysis + caching
```

---

## 3. The High-Level Pipeline

```
GitHub URL
   │
   ▼
1. parseRepoUrl()            → extract { owner, repo }
   ▼
2. getRepoTree()             → recursive file tree from GitHub API
   ▼
3. getSourceFiles()          → fetch contents (batched 5 files, 60 file cap, rate-limit aware)
   ▼
4. parseRepo()               → regex/AST parser → normalized IR (ParsedRepo)
   ▼
5. detectEntryCandidates()   → heuristic: find likely entry files (server.ts, main.py...)
   ▼
6. resolveEntryContents()    → fetch real content of top-3 entry candidates (for M2 context)
   ▼
7. runAnalysisGraph()        → **LangGraph** (parallel M1, M2, M3 → combine)
   ▼
8. IAnalysisResult           → persisted in MongoDB / returned to frontend
```

Steps 1–6 live in `src/services/` (`github.service.ts`, `parser.service.ts`, `ai.service.ts`).
Step 7 is the AI layer proper, in `src/ai/`.

---

## 4. LangGraph: The Heart of the AI Layer

Everything in `src/ai/` revolves around a single compiled **state machine graph** (`analysis.graph.ts`):

```typescript
const workFlow = new StateGraph(GraphState)
  .addNode("m1", M1FolderNode)
  .addNode("m2", m2EntryPointNode)
  .addNode("m3", m3DependencyNode)
  .addNode("combine", combineNode)

  .addEdge(START, "m1")
  .addEdge(START, "m2")
  .addEdge(START, "m3")

  .addEdge("m1", "combine")
  .addEdge("m2", "combine")
  .addEdge("m3", "combine")

  .addEdge("combine", END);
```

This creates a **fan-out / fan-in** execution model:

```
                 ┌──> M1 Folder Topology   ──┐
START ───────────├──> M2 Entry Point       ──┼──> Combine ──> END
                 └──> M3 Dependency Map    ──┘
```

- **Fan-out**: At `START`, all three nodes are branches from the same input state, so LangGraph runs **M1, M2, M3 concurrently** — they don't depend on each other.
- **Fan-in**: LangGraph's `StateGraph` waits for **all three** incoming edges (`m1→combine`, `m2→combine`, `m3→combine`) before it fires the `combine` node.
- `combine` then merges the three outputs into the final `IAnalysisResult` and ends.

This parallelization is the single biggest win: 3 LLM calls that each reason about a *smaller, focused* context run at the same time, instead of one call trying to hold the entire repository.

---

## 5. State Management (`state.ts`)

LangGraph flows data between nodes through a **typed, immutable shared state**, defined with `Annotation.Root`:

```typescript
export const GraphState = Annotation.Root({
  parsedRepo:     Annotation<ParsedRepo>,                    // input IR from parser
  entryCandidates: Annotation<string[]>,                      // heuristic entry file list
  entryContents:  Annotation<Array<{path, content}>>,        // real content for M2

  m1Result:       Annotation<IFolderEntry[] | null>,         // M1 output
  m2Result:       Annotation<IEntryPoint | null>,            // M2 output
  m3Result:       Annotation<IM3Result | null>,              // M3 output

  combined:       Annotation<CombinedOutput | null>,         // final aggregated result
  errors:         Annotation<string[]>,                      // accumulated non-fatal errors
});
```

Two important design points:

1. **Node outputs are fields on the shared state.** Each node reads the state it needs and returns a *partial* new state (`Partial<GraphStateType>`); LangGraph merges it back.
2. **`errors` uses a custom reducer:** `(prev, next) => [...prev, ...next]`. This is a *non-destructive accumulation* reducer — instead of overwriting, every node appends. This is what powers the fault-isolation strategy (Section 9): a node can record its error and the graph keeps running.

---

## 6. The LLM Setup (`model.ts`)

Each module has its **own `ChatGroq` instance**, all pointing at `llama-3.3-70b-versatile` with `temperature: 0` for deterministic analytic output:

```typescript
export const M1Model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0, apiKey: config.GROQ_API_KEY });
export const M2Model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0, apiKey: config.GROQ_API_KEY });
export const M3Model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0, apiKey: config.GROQ_API_KEY });
```

Then each node binds its model to a **Zod schema** for structured output:

```typescript
const m1LLM = M1Model.withStructuredOutput(M1OutputSchema);
```

`temperature: 0` guarantees the LLM doesn't "improvise" — analysis tasks need consistency, not creativity.

---

## 7. The Three Analysis Nodes

### M1 — Folder Topology (`m1Folder.node.ts`)

**Goal:** Describe every directory's purpose and categorize it.

**Input it actually sends to the LLM** (token conscious):
- Unique **folder paths** — derived from `sourcePaths` by stripping the filename: `src/controllers/index.ts` → `src/controllers`
- A **sample of up to 30 file paths** to give context

**Output schema (Zod):**

```typescript
M1OutputSchema = z.object({
  folders: z.array(z.object({
    path: string     // folder path
    purpose: string  // one plain-English sentence
    type: enum["entry","logic","config","utility","test","other"]
  }))
})
```

Because folder analysis is *structural*, M1 runs cheap — it never sees file bodies, only paths.

---

### M2 — Entry Point & Execution Flow (`m2EntryPoint.node.ts`)

**Goal:** Find the real entry file (server.ts, main.py...) and describe the boot sequence.

**How it gets better context than just guessing filenames:**
1. The orchestrator uses `detectEntryCandidates()` — a heuristic that looks for known entry filenames (`server.ts`, `index.js`, `app.py`, `Main.java`, ...) — root-level matches preferred.
2. It then **fetches the actual content** of the top 3 candidates (`resolveEntryContents()`), each truncated to ~800 chars.
3. Both the candidate list **and** the real code are sent to the LLM.

**Output schema (Zod):**

```typescript
M2Outputschema = z.object({
  file: string          // "server.ts"
  executionFlow: string[]  // ordered steps, each a verb-led plain-English sentence
  description: string   // 2-3 sentence bootstrap summary
})
```

So M2 reads real startup code, not filenames — this is what makes the "execution flow" output feel intelligent rather than heuristic.

---

### M3 — Dependency Mapping (`m3Dependency.node.ts`)

**Goal:** Build a file→file import graph plus the critical chain.

**Input constraints (token + correctness):**
- Caps at **`MAX_FILES_FOR_LLM = 40`** files to protect token budget.
- **Filters imports** to *local relative* ones only: `imports.filter(i => i.startsWith(".") || i.startsWith("/"))` — external packages (react, express) are dropped because they're not part of the intra-repo graph.

**Output schema (Zod):**

```typescript
M3OutputSchema = z.object({
  graph: z.array(z.object({
    file: string,        // REQUIRED — the prompt explicitly forces this field
    imports: string[],   // what this file imports
    importedBy: string[] // reverse edges (who imports this)
  })),
  formattedAscii: string // ASCII tree of the most critical chain
})
```

The prompt explicitly instructs the model: *"Every node MUST include the file field — never omit"* and *"if A imports B, then B.importedBy includes A."* (Section 10).

---

## 8. Combine Node — Fan-in Aggregation (`combine.node.ts`)

`combine` is a **pure, non-LLM** node (fast, deterministic). It:

1. Reads `m1Result`, `m2Result`, `m3Result` from state.
2. Checks which are `null` (missing) and pushes a warning into `errors`.
3. Stitches whatever exists into the final `IAnalysisResult`:

```typescript
const result: IAnalysisResult = {
  m1: m1Result ?? [],
  m2: m2Result ?? { file: "", executionFlow: [], description: "" },
  m3: { graph: m3Result?.graph ?? [], formattedAscii: m3Result?.formattedAscii ?? "" },
};
return { combined: { result, errors, success: errors.length === 0 } };
```

`success` is simply `errors.length === 0`. So a single node failure produces `success: false` but still delivers a **useful partial result** — the graph never crashes as a whole.

---

## 9. Fault Isolation & Graceful Degradation

This is the strongest architectural argument to make in the review.

**Monolithic-prompt approach:** one giant prompt → if the LLM fails or malformed JSON comes back → the whole request 500s.

**Our graph approach:**
1. **Every node wraps its LLM call in try/catch.** On error, it returns a safe empty/fallback value *and appends* a message to the `errors` array (via the accumulating reducer). It never throws out of the node.
2. **Combine always produces a result**, even with missing modules — it merges the successful ones and flags the gaps.
3. **`runAnalysisGraph()` returns a `GraphRunResult`** with `{ result, errors, success }` instead of throwing.
4. **Orchestration-level fallback** (`ai.service.ts`): if the entire graph run throws, we still build a **rule/regex-based fallback result** directly from the parsed files (heuristic M1 purposes, first entry candidate, first 8 files as a rough graph) and return it with `success: true` plus warnings.

Net effect: the user gets *a* result (possibly partial) instead of a 500 — the pipeline degrades gracefully at every layer.

---

## 10. Prompt Engineering Strategy

Four files hold all prompts: `m1Prompt.ts`, `m2Prompt.ts`, `m3Prompt.ts`. Two patterns repeat:

### a) System prompt = constraints/rules, user prompt = data
- **System**: role definition ("expert software architect/engineer") + hard rules + category dictionary.
- **User**: built by a `buildXUserPrompt(...)` factory that injects only the *relevant, token-bounded* data.

Examples of rule design:
- M1: *"Ignore noise folders like node_modules, dist, build, .git"* + a category legend (`entry`, `logic`, `config`, `utility`, `test`, `other`).
- M2: *"Each step must be one plain-English sentence starting with an action verb"* + an execution-flow format example (`"server.ts loads environment variables from .env"`).
- M3: *"importedBy is the reverse of imports — if A imports B, then B.importedBy includes A"* + an ASCII tree example.

### b) Zod `.describe()` as inline instructions
Every schema field carries `.describe("...")`, e.g. `type: z.enum([...]).describe("Category of this folder's role")`. LangChain's `withStructuredOutput` passes these descriptions into the model's structured-output/function-calling mechanism — so the model literally sees the field docs while generating, which cuts schema-mismatch and malformed-JSON crashes dramatically.

### c) Token discipline (deliberate choices to praise)
| Technique | Where |
|-----------|-------|
| Only folder paths + 30 sample files to M1 | m1Folder.node.ts |
| Entry content capped to top-3 × 800 chars | m2 prompts / ai.service.ts |
| Only relative imports, max 40 files to M3 | m3Dependency.node.ts |
| Max 60 source files fetched overall | github.service.ts |
| Regex parser (cheap IR) instead of full AST library for the bulk | parser.service.ts |

---

## 11. The Orchestrator (`ai.service.ts`)

`analyseRepository()` is the single entry point the controller calls. It's a clean procedural pipeline:

```typescript
1. parseRepoUrl(cleanUrl)            // { owner, repo } or error
2. tree = await getRepoTree(meta)    // GitHub git tree, skip noise dirs
3. rawFiles = await getSourceFiles(meta, tree)  // batched fetch, 60 cap
4. parsedRepo = parseRepo(rawFiles)  // regex IR: imports/exports/functions per file
5. entryCandidates = detectEntryCandidates(tree)
6. entryContents = resolveEntryContents(meta, entryCandidates) // top 3
7. graphResult = runAnalysisGraph(parsedRepo, entryCandidates, entryContents)
8. on failure → build regex-based fallback result
9. return { result, errors, success }
```

Note the M2 enrichment (`EnrichedParsedRepo`) — the orchestrator deliberately fetches *real code snippets* of suspected entry files so the LLM reasons from evidence, not from names.

---

## 12. Supporting Services (context for the review)

### GitHub service (`github.service.ts`) — the data ingestion
- `getRepoTree`: recursive GitHub tree on `HEAD`, **filters noise dirs** (`node_modules`, `dist`, `build`, `.git`, ...).
- `getSourceFiles`: picks source blobs (`.js/.ts/.jsx/.tsx/.py/.java`), **caps at 60 files**, fetches in **batches of 5 with a 100ms sleep** between batches to respect GitHub rate limits and avoid timeouts.
- `detectEntryCandidates`: prefers root-level entry files, falls back to nested ones.

### Parser service (`parser.service.ts`) — the cheap IR
A **regex-based** parser (fast, no heavy AST dependency) that, per file, extracts:
- `imports` (static, require, dynamic, re-exports for JS/TS; `import`/`from` for Python; `import ...;` for Java),
- `exports`, `functions`, `lineCount`, `language`.

This IR feeds the graph and also powers the fallback path.

### Persistence & caching (`analysis.controller.ts` + DAO)
- The controller hashes `repoUrl` (SHA-256) and checks **MongoDB for a cached analysis** — repeated runs are instant.
- Otherwise it creates a record (`waiting → active → completed | failed`), runs the AI service, and stores the final `IAnalysisResult` in the `RepoAnalysis` Mongoose model.
- Caching is a second layer of performance on top of the parallel graph.

---

## 13. Review Cheat-Sheet — "Why did you build it this way?"

If asked *"why LangGraph and three nodes instead of one prompt?"*:

1. **Parallelism** → M1/M2/M3 run concurrently via fan-out; a monolith serializes (or exceeds) context.
2. **Focused context** → each node sees only what it needs (paths / entry code / import edges) → better accuracy and lower token cost.
3. **Fault isolation** → node-level try/catch + state `errors` reducer + combine-with-`??` defaults + orchestrator fallback = the API always returns something useful.
4. **Deterministic contracts** → `withStructuredOutput(ZodSchema)` guarantees the LLM returns exactly what our `IRepoAnalysis` model expects.
5. **Extensible** → a new analysis dimension (security, API mapping) is just another node + edge; the graph and state scale without re-writing the pipeline.

---

## 14. Where the Code Lives

| Concern | File |
|---------|------|
| Graph definition & runner | `backend/src/ai/analysis.graph.ts` |
| Shared typed state | `backend/src/ai/state.ts` |
| LLM instances | `backend/src/ai/model.ts` |
| M1 / M2 / M3 / combine nodes | `backend/src/ai/nodes/*.node.ts` |
| Prompts & Zod schemas | `backend/src/ai/prompts/*.ts` |
| Orchestrator | `backend/src/services/ai.service.ts` |
| GitHub ingestion | `backend/src/services/github.service.ts` |
| Regex repo parser | `backend/src/services/parser.service.ts` |
| Controller (cache + job lifecycle) | `backend/src/controllers/analysis.controller.ts` |
| Persistence model | `backend/src/models/repoAnalysis.model.ts` |