# Do I Understand the Backend Architecture?

**Yes.** This file is based on only two sources:

1. **The code:** every file in `backend/`. The full write-up is in `backend/backend_analysis.md`.
2. **The diagram:** `backend/codebase_intelligence_full_architecture.png`.

No `.docs` files were used.

*Updated 2026-10-05 after a second full pass over the code (branch `chaitanya`, commit `76b9542`; the source code has not changed since `220c991`).*

The diagram shows the **planned (target) architecture**. The code is a **smaller, working part of that plan**. Below is what I understand from each, and how they compare.

---

## 1. The architecture as built (current code)

```
Client (frontend calls `${VITE_API_URL}/api/analysis`)
  │  POST /api/analysis { repoUrl }
  ▼
Express app (server.ts → app.ts)       cors (all origins) · morgan · JSON body
  │
  ▼
Route → Controller (analysis.controller.ts)
          │ 1. validate repoUrl is a string
          │ 2. sha256(trimmed url) → cache lookup in MongoDB (DAO)
          │    HIT (completed + version ≥ 3) → return cached result
          │ 3. MISS → create record (waiting → active)
          ▼
        ai.service.analyseRepository()   ← orchestrator
          ├─ github.service: parse URL, get repo tree, find entry candidates
          ├─ repograph/ (plain code, no AI) → M3
          │     fetch tarball → regex extractors (JS/TS, Python, Java)
          │     → resolve imports → edges → layers / cycles / orphans → ASCII tree
          └─ ai/ (LangGraph) → M1 + M2
                START → [m1 ‖ m2] → combine → END
                NVIDIA Nemotron via ChatOpenAI + Zod structured output
          │
          ▼
        merge { m1, m2, m3 } → DAO.markCompleted / markFailed → MongoDB
          │
          ▼
        Response { success, cached, data, analysisId, warnings }
```

Key points:
- **Layers:** route → controller → service → DAO → model.
- **One endpoint**, and it is **synchronous**: the client waits for the whole analysis to finish (Vercel allows 60 seconds at most).
- **Cache:** MongoDB only, keyed by a SHA-256 hash of the URL string. Cached results never expire; raising `ANALYSIS_VERSION` makes old results ignored.
- **AI is used only for M1 and M2** (explaining folders and the startup flow). **M3 is built by regular code**, so it is exact and repeatable.
- **If the AI fails, the request still succeeds:** M3 is always returned. M1 and M2 are kept or dropped **together**: if either one adds an error, both are left out.

---

## 2. The architecture as designed (from the PNG)

The diagram has five tiers, from top to bottom:

| Tier | Planned parts (as labelled in the PNG) |
|---|---|
| **Client** | User |
| **Frontend (React)** | Auth UI (login / register), repo input (GitHub URL form), results dashboard (M1 · M2 · M3 · Bonus). A "cached" label marks the path from the frontend to the backend. |
| **Backend API (Node.js / Express)** | Auth service (JWT · bcrypt), repo controller (validate URL · queue), cache service (Redis / MongoDB) |
| **AI layer — LangGraph workflow** | Data fetch (GitHub API calls, rate-limit guard) → parser (AST · imports, chunk + embed) → analysis (M1 · M2 · M3, B1 · B2 · B3). Also: structured output generator (Claude API, prompt chains, JSON schema, citations + M1/M2/M3 sections), vector store (embeddings, similarity search), LangGraph state (workflow graph, retry logic). |
| **Data** | GitHub API (repo tree, file contents, OAuth token at 5000 requests/hour), MongoDB (users, analysis results, repo cache by URL hash), Redis (job queue, short-lived cache) |

Legend: M1 = folder analysis · M2 = entry point · M3 = dependency map · B1/B2/B3 = bonus.

How the plan is meant to flow: User → Frontend → Backend API → AI layer → result → data stores.
In the plan, **everything after the backend API happens inside the LangGraph workflow**: fetching, parsing, all analysis, and producing the final output.

---

## 3. Plan vs current code

| Area | Plan (PNG) | Current code | Status |
|---|---|---|---|
| Auth service (JWT, bcrypt), users in MongoDB | Yes | No auth. The `userId` field exists but is always `null`; `types/type.ts` defines an unused `User` type | ❌ Not built |
| Repo controller: validate URL | Yes | Only checks that `repoUrl` is a string. The GitHub URL format is checked later in `ai.service` | ⚠️ Partly built |
| Repo controller: queue | Yes (Redis job queue) | Request is synchronous. Statuses `waiting/active/completed/failed` exist, but no queue or worker | ⚠️ Partly built (statuses only) |
| Cache service | Redis + MongoDB | MongoDB only (URL hash + version check, no expiry) | ⚠️ Partly built |
| Repo cache by URL hash | Yes | Yes (`repoUrlHash`, SHA-256 of the URL string) | ✅ Built |
| Data fetch | GitHub API calls + rate-limit guard | Octokit: one tarball download + tree API, with file-size, total-size and file-count limits | ✅ Built (no rate-limit guard) |
| GitHub OAuth token | Yes | A single server token (`GITHUB_TOKEN`) | ✅ Built (as a server token, not per-user OAuth) |
| Parser: AST + imports | AST | Regex extractors per language (JS/TS, Python, Java) with import resolution. Tree-sitter is installed but not used | ⚠️ Regex instead of AST |
| Parser: chunk + embed | Yes | None | ❌ Not built |
| Vector store / similarity search | Yes | None | ❌ Not built |
| M1 (folder analysis) | In the AI layer | LLM node in LangGraph | ✅ Built |
| M2 (entry point) | In the AI layer | LLM node in LangGraph | ✅ Built |
| M3 (dependency map) | In the AI layer | **Plain code** (`repograph`): layers, cycles, orphans, layer flow, ASCII tree | ✅ Built, and more reliable than an LLM would be |
| Bonus B1 / B2 / B3 | Yes | None (the PNG doesn't say what they are) | ❌ Not built |
| Structured output generator | Claude API, prompt chains, JSON schema, citations | Zod JSON schemas through `withStructuredOutput` exist. No Claude, no prompt chaining, no citations, no final combined write-up | ⚠️ Schema part only |
| LLM provider | Claude API | NVIDIA Nemotron (`nemotron-3-super-120b-a12b`) through the OpenAI-compatible client | 🔄 Different |
| LangGraph state | Workflow graph + retry logic | `StateGraph` with a shared state and an append-only `errors` list. No retries, no timeouts | ⚠️ Graph only, no retries |
| Where fetch and parse run | Inside the LangGraph workflow | In `ai.service` (outside the graph). LangGraph runs only M1 and M2 | 🔄 Different |
| Results dashboard (M1 · M2 · M3) | Yes | The backend returns M1/M2/M3 JSON that the frontend reads (`/api/analysis`) | ✅ Backend side built |

---

## 4. Summary

- **What exists:** a working core. One synchronous endpoint caches results in MongoDB. Regular code builds the dependency graph (M3), and a small LangGraph workflow (M1 and M2 in parallel, then a combine step) produces the AI explanations.
- **What the PNG plans in addition:** user accounts and auth (JWT, bcrypt), a Redis job queue and short-lived cache, a GitHub rate-limit guard, an AST parser, chunking and embeddings with a vector store, bonus modules B1–B3, a Claude-based output generator with citations, and retry logic.
- **The biggest change from the plan:** M3 was moved **out of the AI layer** and into regular code, and fetching and parsing also run outside LangGraph. In the code, the AI layer only interprets results (M1 and M2); the service layer handles everything else.
- **Weak spots in the current design that matter for the plan:**
  - M1 and M2 succeed or fail together, and a failed AI result is still cached.
  - Cached results never expire, and the cache key is the raw URL text (so `…/repo` and `…/repo/` are cached separately).
  - There is no rate limiting or auth on an endpoint that spends GitHub and LLM quota.
  - The synchronous request has to finish within Vercel's 60-second limit.

*No implementation was done. This file only records my understanding.*
