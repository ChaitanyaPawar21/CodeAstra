# CodeAstra Backend Analysis

This document explains how the `backend/` directory is designed, and how the AI layer fits into it.

---

## Part 1: How the backend is designed

### 1.1 What the backend does

The backend takes a **public GitHub repository URL** and returns an analysis of it in three parts:

| Module | What it produces | Who produces it |
|---|---|---|
| **M1** | Each folder in the repo, with its purpose and type (entry, logic, config, utility, test, other) | **AI (LLM)** |
| **M2** | The entry-point file and its step-by-step startup flow | **AI (LLM)** |
| **M3** | The dependency graph: file imports, reverse imports, layers, cycles, orphans, ASCII tree | **Plain code (no AI)** |

It has **one API endpoint**: `POST /api/analysis` with body `{ "repoUrl": "https://github.com/owner/repo" }`.

### 1.2 Tech stack

- **Runtime:** Node.js + TypeScript (ES modules); `tsx watch` in development
- **Web framework:** Express 5, with `cors` and `morgan` (request logging)
- **Database:** MongoDB through Mongoose
- **GitHub access:** `@octokit/rest`, plus `tar` to unpack the repository tarball in memory
- **AI:** LangChain (`@langchain/openai`) + LangGraph (`@langchain/langgraph`) + `zod` for output schemas
- **LLM provider:** NVIDIA's OpenAI-compatible API (`integrate.api.nvidia.com`), model `nvidia/nemotron-3-super-120b-a12b`
- **Tests:** Vitest (`tests/repograph.test.ts`)
- **Deployment:** Vercel. `vercel.json` routes `/api/*` to the backend service, with a 60-second function limit

> Note: `package.json` also lists `@langchain/groq`, `web-tree-sitter`, `tree-sitter-wasms`, `axios` and `mongodb`, but nothing in `src/` imports them. The code parsers are regex-based, not tree-sitter. The README still mentions Gemini, but the code uses NVIDIA.

### 1.3 Folder structure (layered architecture)

```
backend/
├── server.ts                  → Entry point: connects DB, starts server (or exports app for Vercel)
├── src/
│   ├── app.ts                 → Express app: middleware + mounts router
│   ├── config/
│   │   ├── config.ts          → Loads .env, validates required keys
│   │   └── db.ts              → MongoDB connection
│   ├── routes/
│   │   └── repoAnalysis.route.ts   → POST /  → analyzeRepo
│   ├── controllers/
│   │   └── analysis.controller.ts  → Request handling, cache, lifecycle
│   ├── dao/
│   │   └── analysis.dao.ts         → All DB reads and writes
│   ├── models/
│   │   └── repoAnalysis.model.ts   → Mongoose schema + result types (M1/M2/M3)
│   ├── services/
│   │   ├── ai.service.ts           → ORCHESTRATOR (connects everything)
│   │   ├── github.service.ts       → GitHub API: URL parsing, tree, file content
│   │   ├── parser.service.ts       → Light regex parser (builds the LLM context)
│   │   └── repograph/              → Plain-code dependency-graph pipeline (M3)
│   │       ├── fetch.ts            → Download tarball, filter files
│   │       ├── parse.ts            → Run extractors, read tsconfig paths
│   │       ├── extractors/         → One extractor per language (JS/TS, Python, Java)
│   │       ├── build.ts            → Resolve imports → edges, graph, stats
│   │       ├── layers.ts           → Layer classification, cycle detection (Tarjan)
│   │       ├── tree.ts             → Nested folder tree
│   │       ├── ascii.ts            → ASCII dependency tree
│   │       └── types.ts            → Shared types + ANALYSIS_VERSION
│   ├── ai/                         → AI LAYER (LangGraph)
│   │   ├── model.ts                → LLM client configuration
│   │   ├── state.ts                → Graph state definition
│   │   ├── analysis.graph.ts       → Graph wiring + runAnalysisGraph()
│   │   ├── nodes/                  → m1Folder, m2EntryPoint, combine
│   │   └── prompts/                → System prompts, prompt builders, Zod schemas
│   └── types/type.ts               → Generic types (User, ApiResponse) — not used yet
└── tests/repograph.test.ts
```

The design is the classic **Route → Controller → Service → DAO → Model** layering:

- **Route** only maps the URL to the controller.
- **Controller** handles HTTP: validation, cache, status updates, response.
- **Service** holds the business logic: fetching, parsing, graph building, AI.
- **DAO** (Data Access Object) is the only place that talks to MongoDB.
- **Model** defines the stored document shape.

### 1.4 Startup flow

1. `server.ts` imports `app.ts`, which imports `config.ts`.
2. `config.ts` loads `.env` (from the backend folder, then the parent folders as fallback). If `PORT`, `MONGO_URI`, `GITHUB_TOKEN` or `NVIDIA_API_KEY` is missing, it **throws immediately**.
3. `connectDB()` connects Mongoose to MongoDB. On failure, the process exits.
4. `app.ts` registers `express.json()`, `urlencoded`, `morgan`, `cors()`, a `GET /` health route, and mounts `/api/analysis`.
5. If the server is **not** running on Vercel, it calls `app.listen(PORT)`. On Vercel, the exported `app` is called as a serverless function.

### 1.5 Request lifecycle: `POST /api/analysis`

Code: `src/controllers/analysis.controller.ts`

```
Client
  │  { repoUrl }
  ▼
Controller
  1. Validate repoUrl (must be a string)          → 400 if not
  2. sha256(repoUrl.trim()) → repoUrlHash
  3. DAO.findByUrlHash(hash)                      → cache HIT? return { cached: true, data }
  4. DAO.create(...)  status = "waiting", new jobId (UUID)
  5. DAO.markActive(id)  status = "active"
  6. aiService.analyseRepository(url)             ← all the real work
  7a. failure → DAO.markFailed(id, error) → 500 with errors
  7b. success → DAO.markCompleted(id, result) → 200 { data, analysisId, warnings }
```

**Caching design:**
- The key is the SHA-256 hash of the trimmed URL (`repoUrlHash`, indexed).
- A cached result is used only when `status = "completed"` **and** `analysisVersion >= ANALYSIS_VERSION` (currently `3`). When the pipeline changes, the developer bumps this number, and all old cached results are ignored automatically.

**Status lifecycle stored in MongoDB:** `waiting → active → completed | failed`.
Each row also has `jobId`, `error`, `completedAt` and timestamps. `userId` exists but is always `null`; it is a placeholder for future user accounts.

> The request is **synchronous**: the client waits until the analysis finishes. The status values look like a job queue, but no queue or worker exists yet.

### 1.6 The orchestrator: `ai.service.ts`

`analyseRepository(repoUrl)` is the core of the backend. It runs these steps:

1. **Parse the URL** → `{ owner, repo }` (`github.service.parseRepoUrl`).
2. **Fetch in parallel** (`Promise.all`):
   - `getRepoTree()`: the GitHub tree API listing of all paths (used to detect entry points; a failure here is ignored).
   - `fetchRepoFiles()`: downloads the **whole repo as one tarball** and extracts text files in memory.
3. **Build the M3 graph (plain code)** → `buildRepoGraph()` + `legacyM3()`.
4. **Prepare the LLM context** from files already in memory (no extra network calls):
   - `parseRepo()` on up to **60** source files (`.js .jsx .ts .tsx .py .java`).
   - `detectEntryCandidates(tree)`: root-level `server.ts`, `index.js`, `main.py`, etc.
   - `resolveEntryContents()`: the content of the first 3 candidates (taken from memory, or fetched from GitHub if missing).
5. **Run the AI layer** → `runAnalysisGraph()` produces M1 and M2.
6. Return `{ m1, m2, m3 }` plus warnings.

**Key design rule:** if the AI fails, the request **does not fail**. M3 is always returned; M1 becomes `[]` and M2 becomes `null`, and a warning is added. Only a bad URL, a failed fetch, or a repo with no files counts as a failed request.

### 1.7 The plain-code graph pipeline (M3): `services/repograph/`

This is the part that gives exact, repeatable results, with no AI involved.

**Stage 1 — Fetch (`fetch.ts`)**
- Gets the default branch, then downloads the tarball.
- Streams it through `tar.Parser`, removes the top-level `owner-repo-sha/` folder from each path, and skips:
  - folders such as `node_modules`, `dist`, `.git`, `venv`, `target`, …
  - lockfiles, binary extensions, `.min.js`, `.d.ts`
  - files containing a null byte (binary)
- Limits: **300 KB per file**, **80 MB total**, **3000 files**. Above the file limit, source files and shallow paths are kept first. When anything is cut, `truncated` and `truncatedReason` are set.

**Stage 2 — Parse (`parse.ts` + `extractors/`)**
- `extractors/index.ts` is a **plugin registry**. Each language is a `LanguageExtractor` with:
  - `extract(content)` → imports, exports and *annotations* (framework hints)
  - `resolve(spec, fromFile, ctx)` → `internal` path / `external` package / `unresolved`
- Supported: **JS/TS** (import, require, dynamic import, re-export; ESM `.js` → `.ts` mapping; `index.*` files; tsconfig `paths` aliases), **Python**, **Java**.
- Annotations it detects: Express router, NestJS `@Controller/@Injectable/@Module`, Spring `@RestController/@Service/@Repository/@Entity`, Django `urlpatterns` / `models.Model`.
- If one file fails to parse, the run continues.

**Stage 3 — Build (`build.ts`)**
- Gives each file a short ID (`f1`, `f2`, …).
- Resolves every import into **edges** (`source → target`, with symbols, kind and whether it is type-only).
- **`importedBy` is computed by reversing `imports`**, so it never comes from the LLM.
- Collects the external packages used by each file and counts unresolved imports.

**Stage 4 — Analyse (`layers.ts`)**
- `classifyLayer()` puts each file in a layer (entry, route, controller, service, repository, model, middleware, config, util, types, ui-page, ui-component, state, api-client, test, other). It checks, in this order:
  1. Framework annotation
  2. Path or filename convention (`controllers/`, `*.service.ts`, …)
  3. Graph shape (nothing imports it and it imports many files → entry; it imports nothing and many files import it → util)
- `findCycles()`: Tarjan's algorithm for **import cycles**.
- `computeLayerFlow()`: counts edges between layers (e.g. `controller → service: 4`).
- Orphans: files that import nothing and are imported by nothing.

**Stage 5 — Output (`tree.ts`, `ascii.ts`, `legacyM3`)**
- A nested folder tree object.
- An ASCII dependency tree that starts from the entry files and marks repeated or cyclic files with `↻` (maximum 300 nodes).
- `legacyM3()` also produces the older path-based `graph[]` + `formattedAscii` format, so the frontend keeps working.

### 1.8 Data model (`repoAnalysis.model.ts`)

```
RepoAnalysis {
  userId, repoUrl, repoUrlHash (indexed), jobId (unique),
  status (waiting|active|completed|failed), analysisVersion, error, completedAt,
  result: {
    m1: [{ path, purpose, type }],
    m2: { file, executionFlow[], description } | null,
    m3: { graph[], formattedAscii, version, tree, files, edges,
          cycles, orphans, layerFlow, stats }
  }
}
```

The newer M3 fields are stored as `Schema.Types.Mixed`. The developer keeps the Mongoose schema simple and relies on TypeScript types to enforce the shape.
Indexes: `{ repoUrlHash, status }` (cache lookup) and `{ userId, createdAt }` (for future per-user history).

---

## Part 2: How the AI layer is integrated

### 2.1 Where the AI fits

```
                   analysis.controller
                          │
                          ▼
                 ai.service.analyseRepository()
                 ┌────────┴──────────────────────────┐
                 │                                   │
     PLAIN CODE (M3)                        AI LAYER (M1, M2)
  repograph: fetch → parse →            parser.service → parsedRepo
  build → layers → ascii                github.service → entryCandidates
                 │                      entry file contents
                 │                                   │
                 │                         runAnalysisGraph()
                 │                          (LangGraph)
                 │                                   │
                 └──────────► merge { m1, m2, m3 } ◄─┘
                                      │
                                      ▼
                                MongoDB (DAO)
```

The AI layer is **one function call**, `runAnalysisGraph(parsedRepo, entryCandidates, entryContents)`, made from `ai.service.ts`. The rest of the backend knows nothing about LangChain.

**Main design decision:** the developer first asked the LLM to produce all three modules, including M3 (the README diagram still shows an M3 node). Later they **moved M3 out of the AI layer** into the plain-code `repograph` pipeline, because LLM-generated dependency graphs are unreliable. Now:
- **The AI is used only where interpretation is needed**: explaining folder purposes (M1) and describing the startup flow (M2).
- **Facts come from code**: who imports whom, cycles, layers (M3).
- `M3Model` still exists in `model.ts`, but nothing uses it.

### 2.2 The model: `ai/model.ts`

```ts
new ChatOpenAI({
  model: "nvidia/nemotron-3-super-120b-a12b",
  temperature: 0,
  apiKey: config.NVIDIA_API_KEY,
  configuration: { baseURL: "https://integrate.api.nvidia.com/v1" },
})
```

- It uses LangChain's **OpenAI client** pointed at **NVIDIA's OpenAI-compatible endpoint**. To switch provider, only the base URL and model name need to change.
- There is one client per module (`M1Model`, `M2Model`, `M3Model`), so each module can use a different model later. Right now all three use the same model, because the old M1 model reached end-of-life on 2026-09-01.
- `temperature: 0` keeps the output as consistent as possible.

### 2.3 Shared state: `ai/state.ts`

LangGraph passes a single **state object** between the nodes. It is defined with `Annotation.Root`:

| Field | Purpose | Reducer |
|---|---|---|
| `parsedRepo` | Input: parsed files + source paths | replace |
| `entryCandidates` | Input: possible entry files | replace |
| `entryContents` | Input: content of entry files | replace |
| `m1Result` | Output of the M1 node | replace |
| `m2Result` | Output of the M2 node | replace |
| `combined` | Final merged output | replace |
| `errors` | Errors from every node | **append** (`[...prev, ...next]`) |

The `errors` field uses an **append reducer**. Because M1 and M2 run at the same time, this lets both nodes add errors without overwriting each other.

### 2.4 The graph: `ai/analysis.graph.ts`

```
        START
       ┌──┴──┐
       ▼     ▼
      m1     m2        ← run in parallel
       └──┬──┘
          ▼
       combine         ← waits for both
          ▼
         END
```

```ts
new StateGraph(GraphState)
  .addNode("m1", M1FolderNode)
  .addNode("m2", m2EntryPointNode)
  .addNode("combine", combineNode)
  .addEdge(START, "m1").addEdge(START, "m2")
  .addEdge("m1", "combine").addEdge("m2", "combine")
  .addEdge("combine", END)
  .compile();
```

`runAnalysisGraph()` calls `analysisGraph.invoke(initialState)`, reads `finalState.combined`, and returns `{ result, errors, success }`. Any exception is caught and returned as `[Graph] Fatal: …`, so the AI layer never throws to its caller.

### 2.5 Prompts and structured output: `ai/prompts/`

Each module has three parts:
1. **A Zod schema**: the exact output shape.
2. **A system prompt**: the role, rules and categories.
3. **A user-prompt builder**: a function that puts the repo data into the prompt.

Nodes call `Model.withStructuredOutput(ZodSchema)`. LangChain sends the schema to the model and **validates the reply**, so a node receives a typed object, not free text. This is why no JSON parsing is done by hand.

**M1 (`m1Prompt.ts`)**
- Schema: `{ folders: [{ path, purpose, type: entry|logic|config|utility|test|other }] }`
- System prompt: "You are an expert software architect… one clear sentence per folder", plus a definition of each type.
- User prompt: the list of folders + up to 30 sample file paths. **Only paths are sent, not file contents.**

**M2 (`m2Prompt.ts`)**
- Schema: `{ file, executionFlow: string[], description }`
- System prompt: pick the single real entry point, and describe the startup steps (env → DB → middleware → routes → listen) in the format `"<file> <verb> <what>"`.
- User prompt: the entry candidates + the **first 800 characters** of each candidate's content (up to 3 files).

### 2.6 The nodes: `ai/nodes/`

**`m1Folder.node.ts`**
1. Builds the unique folder list from `parsedRepo.sourcePaths`.
2. If there are no folders → returns `m1Result: []` with an error.
3. Otherwise calls the LLM with the system prompt and user prompt → `m1Result = result.folders`.
4. On error → `m1Result: []` and adds an error to `errors`.

**`m2EntryPoint.node.ts`**
1. Candidates: uses `state.entryCandidates`; if that is empty, it searches `sourcePaths` for known entry filenames.
2. If there are no candidates → returns `{ file: "unknown", … }` with an error.
3. Content: uses `state.entryContents`; if that is empty, it uses the function names from the parser instead.
4. Calls the LLM → `m2Result` is the structured result.
5. On error → a placeholder result and an error.

**`combine.node.ts`**
- Merges `m1Result` and `m2Result` into an `IAnalysisResult`, with an **empty M3**.
- `success = errors.length === 0`.
- The real M3 is attached later in `ai.service.ts`.

### 2.7 How the AI result flows back

In `ai.service.ts`:
```ts
const graphResult = await runAnalysisGraph(parsedRepo, entryCandidates, entryContents);
if (graphResult.success && graphResult.result) {
  m1 = graphResult.result.m1; m2 = graphResult.result.m2;
} else {
  warnings.push("LLM pass unavailable — m1/m2 omitted", ...graphResult.errors);
}
return { result: { m1, m2, m3 }, errors: warnings, success: true };
```

The controller then saves the result with `markCompleted` and returns the AI messages as `warnings` in the response.

### 2.8 How the AI layer handles failures

Errors are caught at three levels, so an AI failure cannot crash a request:

1. **Node level:** each node catches its own error, returns an empty or placeholder result, and adds a message to `errors`.
2. **Graph level:** `runAnalysisGraph` catches any error thrown by `invoke` and returns `success: false`.
3. **Service level:** `ai.service` wraps the call in try/catch. M3 is still returned, and the AI problem becomes a warning.

Also, `ANALYSIS_VERSION` was raised to `3` so that results cached while the old model was broken (empty M1/M2) are ignored and recomputed.

### 2.9 Summary of the AI integration

| Aspect | How it is done |
|---|---|
| Framework | LangChain + LangGraph (JS) |
| Provider | NVIDIA API through LangChain's OpenAI client (custom `baseURL`) |
| Model | `nvidia/nemotron-3-super-120b-a12b`, temperature 0 |
| Orchestration | LangGraph `StateGraph`: M1 and M2 in parallel, then a combine node |
| Output format | Zod schemas + `withStructuredOutput` (typed, validated) |
| Input to the LLM | Folder and file paths (M1); entry file snippets, 800 characters each (M2) |
| Token control | At most 60 source files, 30 sample paths, 3 entry files, 800 characters per file |
| Scope of AI | Only M1 and M2 (interpretation). M3 is plain code (facts). |
| Failure handling | Errors caught at node, graph and service level; M3 is always returned |
| Entry point into the AI layer | `runAnalysisGraph()`, called only from `services/ai.service.ts` |
