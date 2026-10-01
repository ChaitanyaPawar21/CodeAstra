# Chapter 07 — Frontend: Architecture & Flow

> **Component type:** Technical — the React SPA that consumes the analysis.
> **Source:** `frontend/src/**` (post-`features/` restructure)
> **Stack:** React 19, TypeScript, Vite, TailwindCSS 3, framer-motion, React Router v7, ReactFlow (`@xyflow/react`) + dagre.

---

## 1. Layout (4-layer model)

The frontend was restructured to **UI → Hooks → State → API**. Files now live under `app/`, `shared/`, and `features/<name>/`:

```
frontend/src/
├── main.tsx                                  # React bootstrap
├── app/
│   ├── App.tsx                               # <AnalysisProvider> → <AppRouter/>
│   ├── AppRouter.tsx                         # all <Route> declarations
│   └── index.css                             # Tailwind + utilities
├── shared/
│   ├── components/layouts/                    # MainLayout, Sidebar, Navbar
│   ├── data/mockDashboardData.ts             # sample-fallback DashboardData
│   └── types/dashboard.ts                    # UI models
└── features/
    ├── analysis/
    │   ├── context/AnalysisContext.tsx       # state + fetch + transform (the integration)
    │   ├── hooks/useAnalysis.ts              # EMPTY (context still exports useAnalysis)
    │   ├── pages/                            # Landing, Loading, Dashboard, RepositoryStructure,
    │   │                                     #   AIInsights, DependencyGraph, Architecture
    │   └── services/analysis.api.ts          # EMPTY (API still in context)
    ├── chat/pages/AIChatPage.tsx             # static mock; chat.api.ts EMPTY
    └── code/pages/CodeAnalysisPage.tsx       # static IDE mock
```

> The layer split is **started, not finished**: `hooks/useAnalysis.ts` and `services/analysis.api.ts` exist but are empty — fetch + transform still live inside `AnalysisContext.tsx`. See `plan.md` P2.1.

---

## 2. Routes (`app/AppRouter.tsx`)

| Path | Page | Layout | Data |
|------|------|--------|------|
| `/` | LandingPage | none | URL input |
| `/loading` | LoadingPage | none | kicks `analyzeRepo` |
| `/dashboard` | DashboardPage | MainLayout | M1+M2+M3 |
| `/repository` | RepositoryStructurePage | MainLayout | M1 tree + mock editor |
| `/code` | CodeAnalysisPage | MainLayout | static mock |
| `/insights` | AIInsightsPage | MainLayout | aiInsights (mock) |
| `/graph` | DependencyGraphPage | MainLayout | M3 graph |
| `/chat` | AIChatPage | MainLayout | static mock |
| `/architecture` | ArchitecturePage | MainLayout | static diagram |

No protected routes — any page is directly reachable and shows mock data if no analysis ran.

---

## 3. The single integration point (`AnalysisContext.tsx`)

Holds `repoUrl, analysisData, isLoading, error`; exposes `analyzeRepo()` + `setRepoUrl`. All pages read it via `useAnalysis()`.

**`analyzeRepo(url)` flow:**
```
a. build a quick URL-derived fallback immediately → setAnalysisData   (UI never waits)
b. fetch POST <backend>/api/analysis { repoUrl }   (15s AbortController)
c. 200 → transformAnalysisResult(json.data, url) → setAnalysisData
d. fail/abort → keep the fallback
```

**`transformAnalysisResult` maps backend → UI:**
| Backend | Frontend |
|---------|----------|
| `data.m1[]` | `folderHierarchy` (purpose→explanation, `type==="entry"`→starred) |
| `data.m2.file` + `executionFlow[]` | `entryPoints` step list |
| `data.m3.graph[]` | `graphNodes` + `graphEdges` |
| (absent) | URL-derived mocks; tech stack keyword-inferred from repo name |

---

## 4. Dependency graph rendering

`DashboardPage` and `DependencyGraphPage` both render `data.m3` via **ReactFlow**, positioned by **dagre** (`getLayoutedElements`, top-down). `DependencyGraphPage` adds node-click focus + a details side panel (imports, importedBy, AI summary, complexity, risk). The search box is present but **not wired**.

---

## 5. Real vs mock (honest inventory)

| Feature | Real (M1/M2/M3) | Mock/static |
|---------|:-:|-------------|
| URL input + analysis fetch | ✔ | |
| Folder tree / entry flow / dep graph | ✔ | fallback on failure |
| Dashboard summary/metrics, Quick Setup, AI Insights, Critical Files, Request Lifecycle | | hardcoded (no backend B-modules) |
| RepositoryStructure editor, CodeAnalysis, AIChat, Architecture diagram | | 100% static |
| Navbar Re-analyze / Settings / Bell | | non-functional |

---

## 6. Known bugs / gaps (carried into `plan.md`)

- **API base URL mismatch:** context posts to `:5000`, `LandingPage` has a leftover axios call to `:4000` (raw string body), backend is `:4000`. Needs one `VITE_API_BASE_URL`.
- **`error` never set** → failures silently show mock; no `isLive` flag to distinguish real from preview.
- **`Math.random()`** in `transformAnalysisResult` → dashboard numbers change between renders.
- **StrictMode double-fetch** in LoadingPage's `useEffect`.
- Unwired search boxes (graph + repository); static pages look "live".
- `.docs/FRONTEND_FLOW_AND_IMPROVEMENTS.md` still cites pre-restructure paths.
