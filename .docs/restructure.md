# CodeAstra — Frontend Restructure (Current State, File-wise)

> Restructured per `react-architecture.md` — the **4-Layer Model**:
>
> ```
> UI (Presentation)
>   ↓
> Hooks (Orchestration)
>   ↓
> State (Memory)
>   ↓
> API (Backend Communication)
> ```
>
> This document maps the **current** frontend `src/` tree file-by-file into that model. It only lists files that already exist in the frontend today — **no new/extra files are proposed or added.**

---

## 1. Current Folder Structure

```
frontend/src/
│
├── main.tsx                              # React bootstrap (DOM mount)
│
├── app/                                  # App shell — bootstrap & composition
│   ├── App.tsx                           # Provider composition (<AnalysisProvider> → <AppRouter/>)
│   ├── AppRouter.tsx                     # All <Route> declarations (Landing, Loading, MainLayout routes)
│   └── index.css                         # Global styles (Tailwind + base/utilities)
│
├── shared/                               # Cross-cutting, feature-agnostic
│   ├── components/
│   │   └── layouts/                      # App shell UI
│   │       ├── MainLayout.tsx            # Sidebar + Navbar + <Outlet/>
│   │       ├── Sidebar.tsx               # Icon navigation rail
│   │       └── Navbar.tsx                # Brand, URL bar, bell, avatar
│   ├── data/
│   │   └── mockDashboardData.ts          # Sample-fallback DashboardData fixture
│   └── types/
│       └── dashboard.ts                  # UI models (DashboardData, GraphNode, …)
│
└── features/                             # One folder per feature
    ├── analysis/                         # Core feature — repository analysis & visualization
    │   ├── context/
    │   │   └── AnalysisContext.tsx       # State + provider (repoUrl, analysisData, isLoading, error, analyzeRepo)
    │   ├── hooks/
    │   │   └── useAnalysis.ts            # Orchestration read-hook (empty file — context still exports useAnalysis)
    │   ├── pages/                        # UI layer
    │   │   ├── LandingPage.tsx
    │   │   ├── LoadingPage.tsx
    │   │   ├── DashboardPage.tsx
    │   │   ├── RepositoryStructurePage.tsx
    │   │   ├── AIInsightsPage.tsx
    │   │   ├── DependencyGraphPage.tsx
    │   │   └── ArchitecturePage.tsx
    │   └── services/                     # API layer
    │       └── analysis.api.ts           # Empty file — API implementation lives in context today
    │
    ├── chat/                             # AI chat feature (static mock)
    │   ├── pages/
    │   │   └── AIChatPage.tsx            # Static chat UI
    │   └── services/
    │       └── chat.api.ts               # Empty file — no backend endpoint yet
    │
    └── code/                             # Code analysis IDE mock feature
        └── pages/
            └── CodeAnalysisPage.tsx      # Static IDE mock UI
```

---

## 2. File-wise Mapping — Old → Current

| Old location (before restructure) | Current location |
|-----------------------------------|------------------|
| `src/pages/LandingPage.tsx` | `features/analysis/pages/LandingPage.tsx` |
| `src/pages/LoadingPage.tsx` | `features/analysis/pages/LoadingPage.tsx` |
| `src/pages/DashboardPage.tsx` | `features/analysis/pages/DashboardPage.tsx` |
| `src/pages/RepositoryStructurePage.tsx` | `features/analysis/pages/RepositoryStructurePage.tsx` |
| `src/pages/AIInsightsPage.tsx` | `features/analysis/pages/AIInsightsPage.tsx` |
| `src/pages/DependencyGraphPage.tsx` | `features/analysis/pages/DependencyGraphPage.tsx` |
| `src/pages/ArchitecturePage.tsx` | `features/analysis/pages/ArchitecturePage.tsx` |
| `src/pages/CodeAnalysisPage.tsx` | `features/code/pages/CodeAnalysisPage.tsx` |
| `src/pages/AIChatPage.tsx` | `features/chat/pages/AIChatPage.tsx` |
| `src/components/Sidebar.tsx` | `shared/components/layouts/Sidebar.tsx` |
| `src/components/Navbar.tsx` | `shared/components/layouts/Navbar.tsx` |
| `src/layouts/MainLayout.tsx` | `shared/components/layouts/MainLayout.tsx` |
| `src/context/AnalysisContext.tsx` | `features/analysis/context/AnalysisContext.tsx` |
| `src/data/mockDashboardData.ts` | `shared/data/mockDashboardData.ts` |
| `src/types/dashboard.ts` | `shared/types/dashboard.ts` |
| `src/App.tsx` | `app/App.tsx` (+ routing in `app/AppRouter.tsx`) |
| `src/index.css` | `app/index.css` |

No other files exist in `frontend/src/` beyond the tree in Section 1.

---

## 3. How the Current Files Map to the 4-Layer Model

| Layer | Current files occupying it |
|-------|----------------------------|
| **UI** (render, input, navigate) | `features/analysis/pages/*`, `features/chat/pages/*`, `features/code/pages/*`, `shared/components/layouts/*` |
| **Hooks** (orchestration) | `features/analysis/context/AnalysisContext.tsx` exports `useAnalysis()` (used by all pages) |
| **State** (memory only) | `features/analysis/context/AnalysisContext.tsx` — `repoUrl`, `analysisData`, `isLoading`, `error`, setters |
| **API** (backend I/O) | performed inside `features/analysis/context/AnalysisContext.tsx` (fetch to `/api/analyze`) |

**Key note:** the API, orchestration, and state currently live together inside `features/analysis/context/AnalysisContext.tsx` (it performs `fetch` + `transformAnalysisResult` + stores state). The `hooks/useAnalysis.ts` and `services/analysis.api.ts` files exist but are empty — the split is not complete. Same for `chat/services/chat.api.ts`.

---

## 4. Layer Boundaries (rules applied to current files)

| Current file | Talks to | Must NOT |
|--------------|----------|----------|
| `pages/*` (UI) | `useAnalysis()` from context, `navigate`, `mockRepoData` fallback | call backend directly |
| `AnalysisContext.tsx` (State + hooks + API today) | `shared/data`, `shared/types`, backend `/api/analyze` | *(currently)* performs backend fetch + transform; should be passive |

---

## 5. Current Routed Pages (`app/AppRouter.tsx`)

| Path | Page (current file) |
|------|---------------------|
| `/` | `features/analysis/pages/LandingPage.tsx` |
| `/loading` | `features/analysis/pages/LoadingPage.tsx` |
| `/dashboard` | `features/analysis/pages/DashboardPage.tsx` |
| `/repository` | `features/analysis/pages/RepositoryStructurePage.tsx` |
| `/code` | `features/code/pages/CodeAnalysisPage.tsx` |
| `/insights` | `features/analysis/pages/AIInsightsPage.tsx` |
| `/graph` | `features/analysis/pages/DependencyGraphPage.tsx` |
| `/chat` | `features/chat/pages/AIChatPage.tsx` |
| `/architecture` | `features/analysis/pages/ArchitecturePage.tsx` |

Routes `/dashboard`, `/repository`, `/code`, `/insights`, `/graph`, `/chat`, `/architecture` render inside `shared/components/layouts/MainLayout.tsx` (Sidebar + Navbar).

---

## 6. Rule of Thumb (from `react-architecture.md`)

> **UI renders. Hooks coordinate. State stores. API talks to the backend.**
>
> * UI imports only hooks.
> * Hooks import state + API.
> * State imports nothing (pure storage).
> * API imports only the backend.
>
> No skipping layers.

The current tree places every file into `app/`, `shared/`, or `features/<name>/{pages,context}` — matching the model. The only remaining work is moving the backend fetch + transform logic out of `AnalysisContext.tsx` into the existing `hooks/`/`services/` files — **within the current file layout, with no new files added.**