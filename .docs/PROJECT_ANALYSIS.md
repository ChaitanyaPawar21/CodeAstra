# CodeAstra - Project Analysis & Review

> **Project Type:** AI-Powered Codebase Intelligence Agent  
> **Tech Stack:** Node.js, Express, TypeScript, MongoDB, LangGraph, Groq (Llama 3.3), GitHub API  
> **Status:** Functional Backend with AI Pipeline Complete

---

## 1. Project Overview

CodeAstra is an **AI-powered codebase intelligence agent** that accepts a GitHub repository URL and automatically generates a structured, human-readable understanding of the project. It helps developers onboard to unfamiliar codebases in minutes instead of days by providing three core analyses:

- **M1 - Folder Structure Analysis:** Explains the purpose of each major directory in plain English
- **M2 - Entry Point Detection:** Identifies the application starting point and describes the initial execution flow
- **M3 - Dependency Mapping:** Maps file relationships using imports/exports to show how modules interact

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CodeAstra Backend Architecture                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐     ┌──────────────┐     ┌─────────────────┐                  │
│  │  Client  │────▶│  Express API │────▶│  Analysis Ctrl  │                 │
│  │ (GitHub  │     │  (Port 4000) │     │  (POST /api/    │                │
│  │   URL)   │     │              │     │   analysis)     │                │
│  └──────────┘     └──────────────┘     └────────┬────────┘                │
│                                                  │                         │
│                          ┌───────────────────────┼───────────────────┐    │
│                          ▼                       ▼                   ▼    │
│                   ┌─────────────┐         ┌────────────┐      ┌─────────────┐
│                   │ GitHub Svc  │         │ Parser Svc │      │ Analysis    │
│                   │ (Octokit)   │────────▶│ (Regex AST)│      │ DAO (Mongo) │
│                   └──────┬──────┘         └──────┬─────┘      └─────────────┘
│                          │                       │                    │
│                          ▼                       ▼                    │
│                   ┌─────────────────────────────────────────┐        │
│                   │         AI Service (Orchestrator)        │        │
│                   │  1. Fetch Repo Tree                      │        │
│                   │  2. Get Source Files (batched)           │        │
│                   │  3. Parse Files → IR                     │        │
│                   │  4. Resolve Entry Contents               │        │
│                   │  5. Run LangGraph Pipeline               │        │
│                   └────────────────────┬────────────────────┘        │
│                                        │                             │
│                                        ▼                             │
│                         ┌─────────────────────────┐                 │
│                         │      LangGraph Pipeline │                 │
│                         │  ┌─────┐ ┌─────┐ ┌─────┐ │                 │
│                         │  │ M1  │ │ M2  │ │ M3  │ │  (Parallel)    │
│                         │  └──┬──┘ └──┬──┘ └──┬──┘ │                 │
│                         │     │     │     │     │    │                 │
│                         │     └─────┴─────┴─────┘    │                 │
│                         │            ▼               │                 │
│                         │       ┌─────────┐          │                 │
│                         │       │ Combine │          │                 │
│                         │       └────┬────┘          │                 │
│                         └───────────┼────────────────┘                 │
│                                     ▼                                  │
│                          ┌──────────────────┐                          │
│                          │  IAnalysisResult │                          │
│                          │  (M1 + M2 + M3)  │                          │
│                          └────────┬─────────┘                          │
│                                   │                                    │
│                                   ▼                                    │
│                          ┌──────────────────┐                          │
│                          │   Save to Mongo  │                          │
│                          │   Return to API  │                          │
│                          └──────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Work Completed

### 3.1 Core Infrastructure ✅

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| **Express Server** | `server.ts` | ✅ Complete | Entry point, connects DB, starts server |
| **App Configuration** | `src/app.ts` | ✅ Complete | Middleware (cors, morgan, json), route mounting |
| **Config Management** | `src/config/config.ts` | ✅ Complete | Validates env vars (PORT, MONGO_URI, GITHUB_TOKEN, GROQ_API_KEY) |
| **Database Connection** | `src/config/db.ts` | ✅ Complete | Mongoose connection with error handling |
| **Type Definitions** | `src/types/type.ts` | ✅ Complete | User roles, ApiResponse, User interfaces |

### 3.2 Data Layer ✅

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| **RepoAnalysis Model** | `src/models/repoAnalysis.model.ts` | ✅ Complete | Mongoose schema with M1/M2/M3 result structures, indexes |
| **Analysis DAO** | `src/dao/analysis.dao.ts` | ✅ Complete | CRUD operations: findByUrlHash, create, markActive/Completed/Failed |

**Model Schema Highlights:**
- `IFolderEntry` - path, purpose, type (entry/logic/config/utility/test/other)
- `IEntryPoint` - file, executionFlow[], description
- `IDependencyMap` - graph (IDependencyNode[]), formattedAscii
- Indexes on `userId+createdAt`, `repoUrlHash+status`, unique `jobId`

### 3.3 External Services ✅

| Service | File | Status | Key Features |
|---------|------|--------|--------------|
| **GitHub Service** | `src/services/github.service.ts` | ✅ Complete | Octokit REST, recursive tree fetch, batched file content (5 parallel, 100ms delay), entry detection, 60 file limit |
| **Parser Service** | `src/services/parser.service.ts` | ✅ Complete | Regex-based AST parsing for JS/TS, Python, Java; extracts imports, exports, functions |

**GitHub Service Details:**
- Skips: node_modules, dist, build, .git, coverage, .next, out, __pycache__, .vscode, vendor
- Source extensions: .js, .ts, .jsx, .tsx, .py, .java
- Entry candidates: server.*, index.*, main.*, app.*, Main.java
- Batched fetching: 5 parallel requests, 100ms delay between batches

**Parser Service Details:**
- JS/TS: static imports, require(), re-exports, export declarations, function/class/arrow functions
- Python: import/from statements, def/class at module level, filters private (_)
- Java: import statements, public class/interface/enum, public methods

### 3.4 AI Pipeline (LangGraph) ✅

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| **State Management** | `src/ai/state.ts` | ✅ Complete | Annotation.Root with reducers, non-destructive error accumulation |
| **Models** | `src/ai/model.ts` | ✅ Complete | 3x ChatGroq (llama-3.3-70b-versatile, temp=0) for M1/M2/M3 |
| **M1 Node** | `src/ai/nodes/m1Folder.node.ts` | ✅ Complete | Folder topology analysis with structured output |
| **M2 Node** | `src/ai/nodes/m2EntryPoint.node.ts` | ✅ Complete | Entry point detection with content enrichment |
| **M3 Node** | `src/ai/nodes/m3Dependency.node.ts` | ✅ Complete | Dependency mapping with ASCII tree, 40 file cap |
| **Combine Node** | `src/ai/nodes/combine.node.ts` | ✅ Complete | Aggregates parallel results, graceful degradation |
| **Graph Orchestration** | `src/ai/analysis.graph.ts` | ✅ Complete | Fan-out/Fan-in parallel execution, compiled StateGraph |
| **AI Service** | `src/services/ai.service.ts` | ✅ Complete | End-to-end pipeline orchestration |

**LangGraph Architecture:**
```
START → [M1, M2, M3 in PARALLEL] → Combine → END
```
- M1: Folder structure → purpose + category
- M2: Entry point → execution flow steps
- M3: Import graph → ASCII tree + reverse deps
- Error accumulation via reducer: `(prev, next) => [...prev, ...next]`

### 3.5 API Layer ✅

| Component | File | Status | Description |
|-----------|------|--------|-------------|
| **Controller** | `src/controllers/analysis.controller.ts` | ✅ Complete | POST /api/analysis, caching via repoUrlHash (SHA256), jobId tracking |
| **Routes** | `src/routes/repoAnalysis.route.ts` | ✅ Complete | Router mounting |

**Controller Flow:**
1. Validate repoUrl
2. Generate SHA256 hash for caching
3. Check MongoDB for completed analysis (cache hit)
4. Create record with status="waiting"
5. Mark "active"
6. Run AI pipeline
7. On success: mark "completed", save result, return 200
8. On failure: mark "failed", save error, return 500

### 3.6 Prompt Engineering ✅

| Prompt | File | Key Features |
|--------|------|--------------|
| **M1 System** | `src/ai/prompts/m1Prompt.ts` | 6 categories, concise 1-sentence rules, Zod schema with .describe() |
| **M2 System** | `src/ai/prompts/m2Prompt.ts` | Entry detection rules, execution flow format, content enrichment |
| **M3 System** | `src/ai/prompts/m3Prompt.ts` | Internal deps only, reverse imports, ASCII format, required file field |

All prompts use **Zod schemas with `.describe()`** for structured output validation.

### 3.7 Documentation ✅

| Document | File | Description |
|----------|------|-------------|
| **AI Pipeline** | `docs/AI_PIPELINE.md` | 181 lines - deep dive into LangGraph, state, nodes, resilience |
| **Project Structure** | `docs/Structure.md` | Directory tree with descriptions |
| **Features** | `docs/feature.md` | M1/M2/M3 expected outputs, bonus features |
| **Problem Statement** | `docs/codebase_intelligence_problem_statement1.md` | Original requirements |

---

## 4. Code Quality Review

### 4.1 Strengths

| Area | Rating | Notes |
|------|--------|-------|
| **Architecture** | ⭐⭐⭐⭐⭐ | Clean separation: Controller → Service → DAO → Model; AI pipeline decoupled via LangGraph |
| **Type Safety** | ⭐⭐⭐⭐⭐ | Full TypeScript, strict Zod schemas, proper interfaces, generic types |
| **Error Handling** | ⭐⭐⭐⭐ | Try/catch at every layer, error accumulation in graph, graceful degradation |
| **Performance** | ⭐⭐⭐⭐ | Parallel AI nodes, batched GitHub requests (5 parallel), 60 file cap, 40 file LLM cap |
| **Caching** | ⭐⭐⭐⭐ | SHA256 URL hash lookup, returns cached analysis instantly |
| **Prompt Engineering** | ⭐⭐⭐⭐⭐ | Structured outputs via Zod, .describe() annotations, token-aware context |
| **Resilience** | ⭐⭐⭐⭐⭐ | Non-destructive error reducer, combine node handles partial failures |

### 4.2 Areas for Improvement

| Issue | Priority | File(s) | Recommendation |
|-------|----------|---------|----------------|
| **No Tests** | High | `package.json` | Add unit/integration tests (Vitest/Jest) for services, DAO, controller |
| **No Input Validation** | Medium | `analysis.controller.ts` | Add Zod schema validation for repoUrl (format, GitHub domain) |
| **No Auth/Rate Limiting** | Medium | `app.ts` | Add JWT auth, express-rate-limit, helmet for production |
| **Hardcoded Limits** | Low | `github.service.ts`, `m3Dependency.node.ts` | Move MAX_FILES, BATCH_SIZE, MAX_FILES_FOR_LLM to config |
| **No Logging Framework** | Low | Various | Replace console.log with pino/winston for structured logging |
| **Error Types** | Low | Various | Define custom error classes (GitHubError, ParseError, AIError) |
| **Server.ts Missing** | Low | `package.json` | Main entry says "server.ts" but uses tsx watch - ensure it exists (it does) |
| **Env Example** | Low | Root | Add `.env.example` for onboarding |

### 4.3 Security Considerations

| Concern | Status | Notes |
|---------|--------|-------|
| **GitHub Token** | ✅ Secured | In env, passed to Octokit auth |
| **Groq API Key** | ✅ Secured | In env, used only in model.ts |
| **Mongo URI** | ✅ Secured | In env |
| **CORS** | ⚠️ Open | `app.use(cors())` allows all origins - restrict in production |
| **Rate Limiting** | ❌ Missing | No protection against abuse |
| **Input Sanitization** | ⚠️ Basic | Only checks string type - add URL validation |

---

## 5. API Specification

### POST `/api/analysis`

**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo"
}
```

**Response (Success - Fresh):**
```json
{
  "success": true,
  "cached": false,
  "message": "Analysis completed",
  "data": {
    "m1": [
      { "path": "src/controllers", "purpose": "Handles incoming requests", "type": "logic" }
    ],
    "m2": {
      "file": "src/server.ts",
      "executionFlow": ["server.ts loads environment variables", "..."],
      "description": "Bootstraps Express app..."
    },
    "m3": {
      "graph": [
        { "file": "src/server.ts", "imports": ["src/routes"], "importedBy": [] }
      ],
      "formattedAscii": "src/server.ts\n└── src/routes/index.ts"
    }
  },
  "analysisId": "mongodb_id",
  "warnings": []
}
```

**Response (Cached):**
```json
{
  "success": true,
  "cached": true,
  "message": "Returning cached analysis",
  "data": { ... },
  "analysisId": "mongodb_id"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Analysis failed",
  "errors": ["[AI Service] Tree fetch failed: ..."]
}
```

---

## 6. Data Flow Summary

```
GitHub URL
    │
    ▼
[Controller] ──SHA256──▶ [MongoDB Cache Check] ──Hit?──▶ Return Cached
    │                                      Miss
    ▼
[Create Record: waiting] → [Mark Active]
    │
    ▼
[AI Service Orchestrator]
    │
    ├─▶ GitHub Service: getRepoTree() → filterDirs() → detectEntryCandidates()
    │
    ├─▶ GitHub Service: getSourceFiles() [batched, 5 parallel, 100ms delay]
    │
    ├─▶ Parser Service: parseRepo() → ParsedRepo (imports, exports, functions)
    │
    ├─▶ Resolve Entry Contents (top 3 candidates)
    │
    ▼
[LangGraph Pipeline - PARALLEL]
    │
    ├─▶ M1 Node: Folder paths → LLM → IFolderEntry[]
    │
    ├─▶ M2 Node: Entry candidates + contents → LLM → IEntryPoint
    │
    ├─▶ M3 Node: Local imports (40 max) → LLM → IDependencyMap + ASCII
    │
    ▼
[Combine Node] → IAnalysisResult
    │
    ▼
[DAO markCompleted] → [Return to Client]
```

---

## 7. Dependencies Summary

### Production (`package.json`)
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | Web framework |
| mongoose | ^9.8.0 | MongoDB ODM |
| cors | ^2.8.6 | CORS middleware |
| morgan | ^1.11.0 | HTTP logging |
| dotenv | ^17.4.2 | Env loading |
| @octokit/rest | ^22.0.1 | GitHub API |
| axios | ^1.18.1 | HTTP client |
| zod | ^4.4.3 | Schema validation |
| @langchain/core | ^1.2.3 | LangChain core |
| @langchain/langgraph | ^1.4.8 | Graph orchestration |
| @langchain/groq | ^1.3.1 | Groq LLM provider |
| @langchain/google-genai | ^2.2.0 | Google Gemini (unused, kept as dep) |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^7.0.2 | Type checking |
| tsx | ^4.23.1 | TS execution |
| @types/* | Various | Type definitions |

---

## 8. Setup & Run Instructions

```bash
cd backend

# Install dependencies
npm install

# Create .env with:
# PORT=4000
# MONGO_URI=mongodb://localhost:27017/codeastra
# GITHUB_TOKEN=ghp_xxx
# GROQ_API_KEY=gsk_xxx

# Development (with hot reload)
npm run dev

# Production build (not configured yet)
# npm run build && npm start
```

---

## 9. Final Assessment

### Overall Score: **8.5/10**

| Dimension | Score | Comment |
|-----------|-------|---------|
| **Functionality** | 9/10 | All 3 mandatory features (M1, M2, M3) implemented and working |
| **Architecture** | 9/10 | Clean layered architecture, LangGraph parallel pipeline is excellent |
| **Code Quality** | 8/10 | TypeScript strict, good patterns, minor gaps in validation |
| **Documentation** | 9/10 | Comprehensive docs in `/docs`, inline comments where needed |
| **Production Readiness** | 6/10 | Missing tests, auth, rate limiting, structured logging |
| **Innovation** | 9/10 | LangGraph fan-out/fan-in, Zod-structured LLM outputs, graceful degradation |

### Recommended Next Steps (Priority Order)

1. **Add Tests** - Unit tests for services, integration tests for API
2. **Add Authentication** - JWT-based auth for API protection
3. **Add Rate Limiting** - Prevent abuse of GitHub/LLM APIs
4. **Structured Logging** - Replace console with pino
5. **Config Externalization** - Move hardcoded limits to config
6. **Input Validation** - Zod schema for repoUrl
7. **CI/CD Pipeline** - GitHub Actions for lint, test, build
8. **Frontend/UI** - Simple web interface for demo

---

## 10. File Inventory (Source Code Only)

```
backend/
├── server.ts                                    # Entry point
├── package.json                                 # Dependencies
├── src/
│   ├── app.ts                                   # Express app setup
│   ├── config/
│   │   ├── config.ts                            # Env validation
│   │   └── db.ts                                # MongoDB connection
│   ├── types/
│   │   └── type.ts                              # Shared types
│   ├── models/
│   │   └── repoAnalysis.model.ts                # Mongoose schema
│   ├── dao/
│   │   └── analysis.dao.ts                      # Data access
│   ├── services/
│   │   ├── github.service.ts                    # GitHub API (Octokit)
│   │   ├── parser.service.ts                    # Regex AST parser
│   │   └── ai.service.ts                        # Pipeline orchestrator
│   ├── controllers/
│   │   └── analysis.controller.ts               # Request handler
│   ├── routes/
│   │   └── repoAnalysis.route.ts                # Route definition
│   └── ai/
│       ├── analysis.graph.ts                    # LangGraph compilation
│       ├── state.ts                             # State annotations
│       ├── model.ts                             # LLM instances
│       ├── nodes/
│       │   ├── m1Folder.node.ts                 # Folder analysis
│       │   ├── m2EntryPoint.node.ts             # Entry detection
│       │   ├── m3Dependency.node.ts             # Dependency mapping
│       │   └── combine.node.ts                  # Result aggregation
│       └── prompts/
│           ├── m1Prompt.ts                      # M1 system/user prompts
│           ├── m2Prompt.ts                      # M2 system/user prompts
│           └── m3Prompt.ts                      # M3 system/user prompts
└── docs/
    ├── AI_PIPELINE.md                           # Technical deep-dive
    ├── Structure.md                             # Project structure
    ├── feature.md                               # Feature specs
    └── codebase_intelligence_problem_statement1.md  # Requirements
```

---