# Do I Understand the Backend Architecture?

**Yes.** I understand the backend as it is built today (from reading every file in `backend/`, written up in `backend_analysis.md`).
I also read the three architecture diagrams in `.docs/`:

- `codebase_intelligence_full_architecture.png`: the full system (client → frontend → backend → AI layer → data)
- `codebase_intelligence_data_flow.png`: the 8-step request flow
- `lld_module_structure.png`: the planned folders and files

The diagrams show the **planned (target) architecture**. The code is a **smaller version of that plan**. Below is what I understand from each, and how they compare.

---

## 1. The architecture as built (current code)

```
Client
  │  POST /api/analysis { repoUrl }
  ▼
Express app (server.ts → app.ts)
  │
  ▼
Route → Controller (analysis.controller.ts)
          │ 1. validate URL
          │ 2. sha256(url) → cache lookup in MongoDB (DAO)
          │    HIT → return cached result
          │ 3. MISS → create record (waiting → active)
          ▼
        ai.service.analyseRepository()   ← orchestrator
          ├─ github.service: parse URL, get repo tree, find entry candidates
          ├─ repograph/ (plain code, no AI) → M3
          │     fetch tarball → parse (JS/TS, Py, Java extractors)
          │     → build edges → layers / cycles / orphans → ASCII tree
          └─ ai/ (LangGraph) → M1 + M2
                START → [m1 ‖ m2] → combine → END
                NVIDIA Nemotron via ChatOpenAI + Zod structured output
          │
          ▼
        merge { m1, m2, m3 } → DAO.markCompleted / markFailed → MongoDB
          │
          ▼
        Response { data, cached, analysisId, warnings }
```

Key points:
- **Layers:** route → controller → service → DAO → model.
- **One endpoint**, and it is **synchronous**: the client waits for the whole analysis to finish.
- **Cache:** MongoDB, keyed by a SHA-256 hash of the URL. Old results are ignored when `ANALYSIS_VERSION` is raised.
- **AI is used only for M1 and M2** (explaining folders and startup flow). **M3 is built by regular code**, so it is exact and repeatable.
- **If the AI fails, the request still succeeds:** M3 is always returned, and M1/M2 are left out with a warning.

---

## 2. The architecture as designed (from the PNGs)

### 2.1 Full architecture

| Tier | Planned parts |
|---|---|
| Client | User |
| Frontend (React) | Login/register screen, repo URL form, results dashboard (M1, M2, M3, plus bonus modules) |
| Backend API (Express) | Auth service (JWT, bcrypt), repo controller (checks the URL, adds a job to a queue), cache service (Redis/MongoDB) |
| AI layer (LangGraph) | Data fetch (with a GitHub rate-limit guard) → parser (AST, imports, chunking + embeddings) → analysis (M1, M2, M3 + B1, B2, B3); a structured-output generator (Claude API, prompt chains, JSON schema, citations); a vector store (embeddings, similarity search); LangGraph state with retry logic |
| Data | GitHub API (OAuth token, 5000 requests/hour), MongoDB (users, analysis results, URL-hash cache), Redis (job queue, short-lived cache) |

### 2.2 Data flow (8 steps)

1. **Authentication**: check the user's identity and issue a session token
2. **Cache lookup**: check whether a result already exists for this URL (on a hit, skip to step 7)
3. **Repository fetch**: get the folder tree and download file contents
4. **Parsing**: extract imports, exports and functions
5. **Analysis**: 5a structure analysis, 5b entry-point detection, 5c dependency map, 5d critical files (ranked by how central they are in the graph)
6. **Output generation**: turn the results into plain-English text in a JSON shape
7. **Storage + cache write**: save the result so it can be reused
8. **Display to user**

### 2.3 Module structure (planned folders)

- **Backend:** `routes/` (auth, analysis), `controllers/` (auth, analysis, status polling), `services/` (auth, queue with Bull, cache with Redis, GitHub), `models/` (User, Analysis), `middleware/` (JWT auth check, rate limiting)
- **AI pipeline:** `graph/`, `nodes/` (fetch, parse, analyse, generate), `parsers/` (`@babel/parser`, Python AST, regex fallback), `embeddings/` (chunker, vector store), `prompts/` (m1, m2, m3, summary)
- The backend **adds a job to a queue**, and the AI pipeline processes it **separately from the request**.

---

## 3. Plan vs current code

| Area | Plan (PNG) | Current code | Status |
|---|---|---|---|
| Authentication / User model / JWT | Yes | `userId` field exists, always `null` | ❌ Not built |
| Auth middleware, rate limiting | Yes | None | ❌ Not built |
| Job queue (Bull + Redis) | Yes, async processing | Synchronous request; `waiting/active/completed/failed` status exists | ⚠️ Partly built (statuses only) |
| Status polling endpoint | `status.controller` | None | ❌ Not built |
| Cache | Redis + MongoDB | MongoDB only (URL hash + version check) | ⚠️ Partly built |
| Repository fetch | GitHub API | Tarball + tree API via Octokit, size limits | ✅ Built (rate-limit guard missing) |
| Parsing | AST (`@babel/parser`, Python AST) + regex fallback | Regex extractors per language (JS/TS, Py, Java) | ⚠️ Regex only (tree-sitter installed but not used) |
| M1 Structure | LLM | LLM (LangGraph node) | ✅ Built |
| M2 Entry point | LLM | LLM (LangGraph node) | ✅ Built |
| M3 Dependency map | LLM (m3 prompt) | **Plain code** (repograph) | ✅ Built, in a better way than planned |
| 5d Critical file ranking | Yes | Not built (but the graph data needed for it already exists) | ❌ Not built |
| Bonus modules B1/B2/B3 | Yes | None | ❌ Not built |
| Output generation / summary prompt | Claude API, citations | None (raw M1/M2/M3 JSON is returned) | ❌ Not built |
| Embeddings + vector store | Yes | None | ❌ Not built |
| LangGraph retry logic | Yes | No retries; errors are collected and the request carries on | ❌ Not built |
| LLM provider | Claude API | NVIDIA Nemotron (OpenAI-compatible) | 🔄 Different |
| Structure of the AI graph | fetch → parse → analyse → generate, all inside LangGraph | Fetch, parse and M3 run in `ai.service` outside the graph; LangGraph runs only M1 and M2 in parallel | 🔄 Different |

---

## 4. Summary

- **What exists:** a working core. One synchronous endpoint caches results in MongoDB. A plain-code dependency graph produces M3, and a small LangGraph workflow (M1 and M2 in parallel, then a combine step) produces the AI explanations.
- **What the PNGs plan in addition:** user accounts and login, a Redis/Bull job queue with status polling, embeddings and a vector store, critical-file ranking, bonus modules, and a final summary step using Claude.
- **The biggest change from the plan:** M3 was moved **out of the AI** and into regular code. In the plan, the AI layer does fetching, parsing and all analysis. In the code, the AI layer only interprets results (M1 and M2), and the service layer handles everything else.

*No implementation was done. This file only records my understanding.*
