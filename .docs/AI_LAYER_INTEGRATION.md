# CodeAstra — AI Layer Integration: Complete Architecture (File-wise)

>**how** the AI layer is wired into the CodeAstra project — every file involved, every endpoint, and how a request flows from the browser to the LangGraph AI pipeline and back.

---

## 1. Where the AI Layer Sits in the Project

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                      │
│                                                                        │
│   LandingPage ──▶ LoadingPage ──▶ AnalysisContext ──▶ Dashboard UI     │
│        │                                                                │
│        └──────────────▶  POST /api/analysis  ◀─────────────────────────┘
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ HTTP (Express)
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          BACKEND (Node + Express)                      │
│                                                                         │
│   server.ts ──▶ app.ts ──▶ repoAnalysis.route.ts ──▶ analysis.controller.ts
│                                                                         │
│                        analysis.controller.ts                       │
│          ┌──────────────┼──────────────────────────────┐               │
│          │ cache check  │  job lifecycle               │               │
│          ▼              ▼                              ▼               │
│   analysis.dao.ts ◀── API ──▶ ai.service.ts                             │
│          ▲                    │                                         │
│   Mongo "RepoAnalysis"      ▼                                           │
│                    analysis.graph.ts  (LangGraph StateGraph)            │
│                        │            │            │                      │
│                    M1 node      M2 node      M3 node  ──▶ combine node  │
│                        │            │            │                      │
│                    model.ts (ChatGroq ×3, llama-3.3-70b)               │
│                    prompts/   (system prompts + Zod schemas)            │
│                                                                         │
│   github.service.ts ◀── context for M2 entry file contents             │
│   parser.service.ts ──▶ parsedRepo IR fed into the graph state         │
└────────────────────────────────────────────────────────────────────────┘
```

**Key point:** the "AI layer" isn't isolated — it's a **middle stage of one request pipeline**. The frontend never calls the AI directly. Everything funnels through **one REST endpoint** (`POST /api/analysis`), which the backend converts into: GitHub fetch → code parse → LangGraph LLM analysis → Mongo persistence → response.

---

## 2. Endpoint Map — Every Network Entry Point

| # | Method & Path | Where defined | Who calls it | Purpose |
|---|---------------|---------------|--------------|---------|
| 1 | `GET /` | `backend/src/app.ts:13` | Browser | Health check ("Hello from server") |
| 2 | `POST /api/analysis` | `backend/src/routes/repoAnalysis.route.ts:6` | `frontend/src/context/AnalysisContext.tsx:236` (port 5000) and `frontend/src/pages/LandingPage.tsx:15` (port 4000) | **The single entry point into the AI pipeline.** Body: `{ repoUrl: string }` |
| 3 | `POST http://localhost:4000/api/analysis` | — | `LandingPage.tsx:15` (`repoAnalysis()`) | Same endpoint as #2 (hardcoded dev call, fires on page load) |

> ⚠️ Observation to mention in review: two frontend call sites hit **different ports** (`4000` vs `5000`) for the same route — `server.ts` defaults to `config.PORT` (4000). In your explanation, clarify that the canonical path is the `AnalysisContext` one (5000) or note it as a known config inconsistency.

All other UI pages (`DashboardPage`, `DependencyGraphPage`, `RepositoryStructurePage`, `AIInsightsPage`, ...) are **read-only consumers** of the analysis already stored in the React context — they do not call the backend.

---

## 3. File-wise Architecture (Full Chain)

### 3.1 Frontend — how the request begins

| File | Role in the integration |
|------|------------------------|
| `frontend/src/pages/LandingPage.tsx` | Captures the GitHub URL from the user input → `setRepoUrl(url)` → `navigate('/loading')`. Also has an unused live `axios.post("http://localhost:4000/api/analysis", repoUrl)` demo call in a `useEffect` (`repoAnalysis()`). |
| `frontend/src/pages/LoadingPage.tsx` | On mount calls `analyzeRepo(repoUrl)` (kicks the backend race), animates 5 fake pipeline steps (Cloning / Parsing / Dependency Graph / Entry Points / AI Insights), then navigates to `/dashboard`. |
| `frontend/src/context/AnalysisContext.tsx` | **The actual HTTP integration point.** `analyzeRepo()` does a `fetch('http://localhost:5000/api/analysis', { method: 'POST', body: JSON.stringify({ repoUrl }) })` with a **15s AbortController timeout**, then `transformAnalysisResult()` reshapes the backend `IAnalysisResult` into the dashboard shape. |
| `frontend/src/pages/CodeAnalysisPage.tsx` | Pure mock/`visual placeholder` code editor — decorative AI insights, no network call. |

**Frontend resilience detail:** `analyzeRepo` first sets an instantly-generated `quickFallback` (mock dashboard data), then fires the backend request. If the backend fails or the 15s abort fires, the UI still renders with dynamic placeholder data — again the "degrade gracefully" pattern, now at the client.

### 3.2 Backend bootstrap

| File | Role |
|------|------|
| `backend/server.ts` | `connectDB()` (Mongo) + `app.listen(config.PORT)`. Boots everything. |
| `backend/src/app.ts` | Express middlewares (`express.json`, `cors`, `morgan`) + **mounts the AI route**: `app.use("/api/analysis", analysisRouter)`. |
| `backend/src/config/config.ts` | Env loading & validation (`PORT`, `MONGO_URI`, `GITHUB_TOKEN`, `GROQ_API_KEY`). The **AI keys are read here** and passed to `ChatGroq` in `model.ts`. |

### 3.3 The route → controller (where AI gets called)

| File | Role |
|------|------|
| `backend/src/routes/repoAnalysis.route.ts` | One line: `router.post("/", analyzeRepo)`. Binds the REST endpoint to the controller. |
| `backend/src/controllers/analysis.controller.ts` | **The integration hub.** Flow inside `analyzeRepo`: |
| | 1. Validate `repoUrl` (400 if missing). |
| | 2. `sha256(repoUrl)` → `repoUrlHash`. |
| | 3. **Cache check** → `analysisDAO.findByUrlHash(hash)` → if a `completed` record exists, return it immediately (`cached: true`). |
| | 4. Create Mongo record `{ status: "waiting", jobId: uuid }`. |
| | 5. `analysisDAO.markActive(id)` → status `active`. |
| | 6. `const aiResult = await aiService.analyseRepository(cleanUrl)` ← **the AI layer call.** |
| | 7. On success → `analysisDAO.markCompleted(id, aiResult.result)` → respond `{ success, cached:false, data, analysisId, warnings }`. |
| | 8. On failure → `analysisDAO.markFailed(id, errors.join(" | "))` → respond 500. |
| `backend/src/dao/analysis.dao.ts` | All Mongo operations: `findByUrlHash` (cache), `create`, `markActive`, `markCompleted`, `markFailed`. Encapsulates `RepoAnalysis` model. |
| `backend/src/models/repoAnalysis.model.ts` | Mongoose schema/documents. Persists `result: { m1: IFolderEntry[], m2: IEntryPoint, m3: IDependencyMap }` — **the exact shape the AI graph produces.** Also defines the TS interfaces (`IAnalysisResult`, `IFolderEntry`, `IEntryPoint`, `IDependencyNode`) used all the way down in the AI layer. |

### 3.4 The AI layer itself (`backend/src/ai/**`)

| File | Role |
|------|------|
| `src/ai/model.ts` | Creates **3 `ChatGroq` instances** (`M1Model`, `M2Model`, `M3Model`) — all `llama-3.3-70b-versatile`, `temperature: 0`, key from `config.GROQ_API_KEY`. |
| `src/ai/state.ts` | `GraphState = Annotation.Root({...})` — the shared typed state: `parsedRepo`, `m1Result`, `m2Result`, `m3Result`, `combined`, `errors`, `entryCandidates`, `entryContents`. |
| `src/ai/analysis.graph.ts` | Builds & compiles the `StateGraph` (fan-out M1/M2/M3 → fan-in `combine` → END) and exports `runAnalysisGraph()` which `.invoke()`s the graph and normalizes the result into `GraphRunResult { result, errors, success }`. |
| `src/ai/nodes/m1Folder.node.ts` | M1 — derives unique **folder paths** from `parsedRepo.sourcePaths`, calls `M1Model.withStructuredOutput(M1OutputSchema)`, returns `m1Result`. |
| `src/ai/nodes/m2EntryPoint.node.ts` | M2 — picks entry candidates (from graph-state `entryCandidates` or fallback list), uses the fetched `entryContents`, calls `M2Model`, returns `m2Result`. |
| `src/ai/nodes/m3Dependency.node.ts` | M3 — maps imports of **top 40 files**, filters to **relative imports only**, calls `M3Model`, returns `m3Result` (graph + ASCII). |
| `src/ai/nodes/combine.node.ts` | Pure aggregator — merges `m1Result`/`m2Result`/`m3Result` into `IAnalysisResult`, flags missing modules in `errors`, sets `success`. |
| `src/ai/prompts/m1Prompt.ts` | M1 system prompt + `buildM1UserPrompt()` + `M1OutputSchema` (Zod). |
| `src/ai/prompts/m2Prompt.ts` | M2 system prompt + `buildM2UserPrompt()` + `M2Outputschema` (Zod). |
| `src/ai/prompts/m3Prompt.ts` | M3 system prompt + `buildM3UserPrompt()` + `M3OutputSchema` (Zod). |

### 3.5 Supporting services the AI layer depends on

| File | Role in AI integration |
|------|------------------------|
| `src/services/github.service.ts` | **Data ingestion for the LLM.** `getRepoTree` (recursive GitHub tree, skips noise dirs), `getSourceFiles` (60-file cap, batches of 5 + rate-limit sleep), `detectEntryCandidates` (finds likely entry files), `getFileContent` (base64 decode). |
| `src/services/parser.service.ts` | **Regex parser** → converts fetched files into the `ParsedRepo` IR (`imports`, `exports`, `functions`, `language`, `lineCount`) — this IR is the graph's input state. |
| `src/services/ai.service.ts` | **The orchestrator that glues it all together.** `analyseRepository()` = parse URL → fetch tree → fetch source files → `parseRepo()` → `detectEntryCandidates()` → `resolveEntryContents()` (top 3 entry file bodies) → `runAnalysisGraph()` → on graph failure build a **regex/heuristic fallback result** so the API still returns data. |

---

## 4. End-to-End Request Sequence (one full cycle)

```
User pastes "https://github.com/facebook/react" in LandingPage
   │
   ▼ navigate('/loading')
LoadingPage mounts → analyzeRepo(url)
   │
   ▼ useEffect → fetch POST http://localhost:5000/api/analysis
   │              body: { "repoUrl": "https://github.com/facebook/react" }
   ▼
express.json() parses body
   ▼
app.ts → mounted at /api/analysis → repoAnalysis.route.ts → analyzeRepo() controller
   │
   ├── 1. repoUrlHash = sha256(url)
   ├── 2. analysisDAO.findByUrlHash(hash)  → HIT? → return cached result (cached:true, done)
   │
   ├── 3. analysisDAO.create({ status:"waiting", jobId })  → markActive
   │
   ├── 4. aiService.analyseRepository(url)
   │        a. parseRepoUrl → { owner: "facebook", repo: "react" }
   │        b. getRepoTree(meta)            → GitHub recursive tree
   │        c. getSourceFiles(meta, tree)   → 60 files max, 5-at-a-time fetches
   │        d. parseRepo(rawFiles)          → ParsedRepo (regex IR)
   │        e. detectEntryCandidates(tree)  → ["index.js", ...]
   │        f. resolveEntryContents(meta, top3) → real file bodies (for M2)
   │        g. runAnalysisGraph(parsedRepo, entryCandidates, entryContents)
   │              │  StateGraph.invoke({
   │              │    parsedRepo, entryCandidates, entryContents,
   │              │    m1Result:null, m2Result:null, m3Result:null, errors:[], combined:null
   │              │  })
   │              │
   │              ├──▶ [parallel]
   │              │    M1 ──> M1Model(invoke system+user prompts) ──> m1Result
   │              │    M2 ──> M2Model(invoke system+user prompts) ──> m2Result
   │              │    M3 ──> M3Model(invoke system+user prompts) ──> m3Result
   │              │
   │              └──▶ combine ──> IAnalysisResult { m1, m2, m3 } (+ errors, success)
   │        h. graph fails? → build regex/heuristic fallback IAnalysisResult
   │
   ├── 5. analysisDAO.markCompleted(id, result) → persist + status:completed
   │
   └── 6. res.json({ success:true, cached:false, data:result, analysisId, warnings })
   ▼
AnalysisContext.transformAnalysisResult(data) → DashboardData → UI renders
```

---

## 5. The Single Endpoint — Request/Response Contract

### Request
```
POST /api/analysis
Content-Type: application/json

{ "repoUrl": "https://github.com/facebook/react" }
```

### Response — cache hit (fast path, no AI call)
```json
{
  "success": true,
  "cached": true,
  "message": "Returning cached analysis",
  "data": { "m1": [...], "m2": {...}, "m3": {...} },
  "analysisId": "663f...abc"
}
```

### Response — fresh analysis (AI pipeline ran)
```json
{
  "success": true,
  "cached": false,
  "message": "Analysis completed",
  "data": { "m1": [...], "m2": {...}, "m3": {...} },
  "analysisId": "663f...abc",
  "warnings": ["[M3] ...optional..."]
}
```

### Response — failure
```json
{ "success": false, "message": "Analysis failed", "errors": ["[AI Service] Tree fetch failed: ..."] }
```

### Response — bad input
```json
{ "success": false, "message": "repoUrl is required" }
```

The `data` shape **is** the AI graph output (`IAnalysisResult`):

```typescript
interface IAnalysisResult {
  m1: IFolderEntry[];          // { path, purpose, type: "entry"|"logic"|"config"|"utility"|"test"|"other" }
  m2: IEntryPoint;             // { file, executionFlow: string[], description }
  m3: IDependencyMap;          // { graph: IDependencyNode[], formattedAscii }
}
```

---

## 6. Job Lifecycle (persistence layer integration)

```
create           → status: "waiting"
markActive       → status: "active"       (LLM analysis in progress)
markCompleted    → status: "completed"    + result + completedAt   (cached afterward)
markFailed       → status: "failed"       + error + completedAt
```

- The **cache key** is `repoUrlHash` (sha256 of URL) with `status: "completed"`.
- This is why the **same URL analyzed twice costs zero AI calls** on the second hit — the DB *is* the cache.

---

## 7. What the Frontend Does With the AI Output

`transformAnalysisResult()` in `AnalysisContext.tsx` maps the AI payload into UI models:

| AI field | Becomes (frontend) |
|----------|--------------------|
| `data.m1[]` | `folderHierarchy` → RepositoryStructure / Folder cards |
| `data.m2.file` + `data.m2.executionFlow[]` | `entryPoints` → bootstrap sequence list |
| `data.m3.graph[]` (`file`, `imports`, `importedBy`) | `graphNodes` + `graphEdges` → interactive `DependencyGraphPage` |
| `data.summary` (if present) | Dashboard summary / tech stack |

Pages consuming context: `DashboardPage`, `RepositoryStructurePage`, `DependencyGraphPage`, `AIInsightsPage`, `ArchitecturePage`, `AIChatPage` (all through `useAnalysis()`).

---

## 8. Integration Review Cheat-Sheet

If asked *"How did you integrate the AI layer?"* — say:

1. **Not a separate microservice** — the AI layer is a **function call inside the controller** (`aiService.analyseRepository()`), invoked from a single REST route `POST /api/analysis`.
2. **REST in, AI middle, DB out** — Express parses the URL → controller handles cache & job status → AI service fetches GitHub → regex-parses files → feeds a **LangGraph state machine** of 3 parallel LLM nodes → aggregates → stores the result in Mongo → returns it.
3. **Frontend only knows the endpoint** — `AnalysisContext` POSTs the URL with a 15s timeout; if the AI is slow or fails it gracefully renders dynamic placeholder data.
4. **The AI graph output shape == the Mongo document shape == the API response shape** (`IAnalysisResult`), so there is **zero transformation between the LangGraph output and the database** — the contract is one TypeScript interface used end-to-end.
5. **Two performance layers**: parallel LangGraph execution (LLM-level) + Mongo result caching by URL hash (system-level).

---

## 9. Quick File Reference (integration path)

```
frontend/src/pages/LandingPage.tsx            ──▶ user input + (demo axios call :4000)
frontend/src/pages/LoadingPage.tsx             ──▶ triggers analyzeRepo() + fake progress
frontend/src/context/AnalysisContext.tsx       ──▶ POST :5000/api/analysis + transform + fallback
        │
        ▼  HTTP
backend/src/app.ts                            ──▶ mounts "/api/analysis"
backend/src/routes/repoAnalysis.route.ts      ──▶ POST "/" → analyzeRepo
backend/src/controllers/analysis.controller.ts ─▶ cache check → job lifecycle → AI call
        │
        ├── backend/src/dao/analysis.dao.ts    ──▶ Mongo (create / markActive / markCompleted / markFailed / cache lookup)
        ├── backend/src/models/repoAnalysis.model.ts ─▶ schema + shared IAnalysisResult types
        │
        └── backend/src/services/ai.service.ts ──▶ orchestrator pipeline
                ├── backend/src/services/github.service.ts  ──▶ tree/files/entry candidates
                ├── backend/src/services/parser.service.ts  ──▶ regex IR (ParsedRepo)
                │
                └── backend/src/ai/analysis.graph.ts ──▶ LangGraph StateGraph
                        ├── backend/src/ai/state.ts
                        ├── backend/src/ai/model.ts                   (ChatGroq ×3)
                        ├── backend/src/ai/nodes/m1Folder.node.ts     → m1Result
                        ├── backend/src/ai/nodes/m2EntryPoint.node.ts → m2Result
                        ├── backend/src/ai/nodes/m3Dependency.node.ts → m3Result
                        ├── backend/src/ai/nodes/combine.node.ts      → IAnalysisResult
                        └── backend/src/ai/prompts/{m1,m2,m3}Prompt.ts (prompts + Zod schemas)
```