# CodeAstra — Frontend Restructure Plan (based on `react-architecture.md`)

> This document restructures the **entire CodeAstra frontend** following the **4-Layer Model** defined in `react-architecture.md`:
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
> It includes the new folder structure, the file-by-file mapping (old → new), strict layer rules applied to this codebase, and "my touch" — the concrete fixes/improvements folded into the restructure so the app also becomes more correct and user-friendly (no visual/design changes).
>
> **Scope:** Everything below is the authoritative restructure answer — all in this one file.

---

## 1. What's Wrong With the Current Structure (Why Restructure)

The current `src/` mixes layers in one flat tree:

```
src/
├── components/     (shell, mixed with page-only doodads)
├── context/        (AnalysisContext = API + orchestration + rendering fallback + state = 4 layers in 1 file)
├── data/           (mock fallback)
├── pages/          (10 pages, including feature pages from unrelated areas: chat, code, architecture)
├── types/
└── (...)

```

Concrete violations of the reference model:

| Violation | Where | What it breaks |
|-----------|-------|----------------|
| **State does API calls** | `context/AnalysisContext.tsx` performs `fetch()` and builds responses | State layer must be passive storage (whiteboard); async logic belongs to Hooks |
| **State does navigation & UI fallback** | `AnalyzeContext` builds `quickFallback` UI data | State must not render/decide; normalization belongs to API layer |
| **UI calls API directly** | `pages/LandingPage.tsx:15` does `axios.post(:4000)` | UI must only talk to Hooks; endpoint knowledge is leaking into a page |
| **No Hook layer** | there are zero `use*` orchestration hooks | loading/error/state transitions are duplicated or missing |
| **No API layer** | backend URL + body + timeout hardcoded in components | changing one endpoint edits many files |
| **Feature boundaries mixed** | `pages/` holds analysis, chat, code-editor, architecture together | unrelated features scale together; no ownership |

The restructure below fixes all of these by construction.

---

## 2. The New Folder Structure (4-Layer × Feature-Based)

```
frontend/src/
│
├── app/                                    # ⚙️ App shell — bootstrap & composition
│   ├── main.tsx                            # ReactDOM bootstrap (moved from src/main.tsx)
│   ├── App.tsx                             # Router + provider composition (moved from src/App.tsx)
│   ├── router.tsx                          # (NEW) all <Route> declarations, kept out of App.tsx
│   └── styles/
│       └── index.css                       # global styles (moved from src/index.css)
│
├── shared/                                 # 🔧 Cross-cutting, feature-agnostic
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx              # (was src/layouts/MainLayout.tsx)
│   │   │   ├── Sidebar.tsx                 # (was src/components/Sidebar.tsx)
│   │   │   └── Navbar.tsx                  # (was src/components/Navbar.tsx)
│   │   └── ui/                             # (NEW, extracted) dumb primitives
│   │       ├── Card.tsx                    # was inline card divs in DashboardPage
│   │       ├── Badge.tsx                   # risk/type pills used across pages
│   │       ├── Spinner.tsx                 # loading indicator
│   │       ├── EmptyState.tsx              # "no analysis yet" / error placeholder
│   │       ├── CopyButton.tsx              # was inline Copy icons in Dashboard
│   │       └── SectionHeading.tsx          # repeated card headers
│   ├── hooks/
│   │   └── useDebounce.ts                  # (NEW) for RepositoryStructure search, graph search
│   ├── lib/
│   │   ├── cn.ts                           # clsx + tailwind-merge helper (deps already present)
│   │   └── repoUrl.ts                      # parseGitHubUrl() moved out of context (pure fn)
│   ├── data/
│   │   └── mockDashboardData.ts            # (was src/data/mockDashboardData.ts) — sample fixtures only
│   └── types/
│       └── dashboard.ts                    # (was src/types/dashboard.ts) — UI models (DashboardData…)
│
└── features/                               # 🎯 One folder per feature; each holds the 4 layers
    │
    ├── analysis/                           # ★ CORE FEATURE — analyze & visualize a repo
    │   ├── services/                       # ── API layer (talks to backend only)
    │   │   ├── http.client.ts              # (NEW) axios instance: base URL + timeout + auth/error normalization
    │   │   ├── analysis.api.ts             # (NEW) analyseRepository(repoUrl, { force }) → RawAnalysisResult
    │   │   ├── analysis.mapper.ts          # (MOVED) transformAnalysisResult() from context — normalize raw→UI
    │   │   └── analysis.dto.ts             # (NEW) types mirroring backend IAnalysisResult (m1/m2/m3)
    │   ├── store/                          # ── State layer (passive)
    │   │   └── analysis.store.tsx          # (REBUILT from context/AnalysisContext.tsx) values + setters only
    │   ├── hooks/                          # ── Orchestration layer
    │   │   ├── useAnalysis.ts              # (NEW read hook) { analysisData, isLive, isLoading, error, repoUrl }
    │   │   └── useRepositoryAnalysis.ts    # (NEW write hook) { analyzeRepository, reAnalyze, clear }
    │   └── ui/                             # ── UI layer (dumb & declarative)
    │       ├── pages/
    │       │   ├── LandingPage.tsx         # (was pages/LandingPage.tsx)
    │       │   ├── LoadingPage.tsx         # (was pages/LoadingPage.tsx)
    │       │   ├── DashboardPage.tsx       # (was pages/DashboardPage.tsx) — now a thin composer
    │       │   ├── RepositoryStructurePage.tsx  # (was pages/RepositoryStructurePage.tsx)
    │       │   ├── AIInsightsPage.tsx      # (was pages/AIInsightsPage.tsx)
    │       │   └── DependencyGraphPage.tsx # (was pages/DependencyGraphPage.tsx)
    │       └── components/
    │           ├── dependencyGraph/
    │           │   ├── GlowNode.tsx        # (was inline custom node in DependencyGraphPage)
    │           │   ├── layout.ts           # (was getLayoutedElements/dagre — duplicated in 2 pages → 1 copy)
    │           │   └── DependencyGraphCanvas.tsx  # (NEW) the reusable ReactFlow shell used by Dashboard + page
    │           ├── EntryPointFlow.tsx      # (was inline "Entry Point Detection" block in DashboardPage)
    │           ├── SummaryCard.tsx         # (was inline Summary card in DashboardPage)
    │           ├── RepoOverviewCard.tsx    # (was inline Repository Overview card)
    │           ├── SetupGuideCard.tsx      # (was inline Quick Setup guide)
    │           ├── CriticalFilesList.tsx   # (was inline Critical Files block)
    │           ├── RequestLifecycleBar.tsx # (was inline Request Lifecycle block)
    │           ├── AiInsightsSidebar.tsx   # (was right sidebar in DashboardPage)
    │           ├── FolderExplorer.tsx      # (was file-tree sidebar in RepositoryStructurePage)
    │           ├── CodeViewer.tsx          # (was editor area in RepositoryStructurePage)
    │           └── InsightCard.tsx         # (was inline card in AIInsightsPage)
    │
    ├── chat/                               # AI Chat feature (currently static mock)
    │   ├── services/
    │   │   └── chat.api.ts                 # (NEW, future) chat/ask endpoint
    │   ├── hooks/
    │   │   └── useChat.ts                  # (NEW, future) { messages, sendMessage, isLoading }
    │   ├── store/
    │   │   └── chat.store.tsx              # (NEW, future) messages state
    │   └── ui/
    │       ├── pages/ChatPage.tsx          # (was pages/AIChatPage.tsx)
    │       └── components/
    │           ├── ChatMessage.tsx         # (was inline message blocks)
    │           └── SuggestionChips.tsx     # (was inline chips row)
    │
    ├── code/                               # Code Analysis IDE mock feature
    │   └── ui/
    │       ├── pages/CodeAnalysisPage.tsx  # (was pages/CodeAnalysisPage.tsx)
    │       └── components/                 # (was inline blocks: Explorer, Editor, InsightsPanel)
    │
    └── architecture/                       # System architecture diagram feature
        ├── services/architecture.data.ts   # (NEW) static node/edge definitions (was inline constants)
        └── ui/
            ├── pages/ArchitecturePage.tsx  # (was pages/ArchitecturePage.tsx)
            └── components/ArchitectureGraph.tsx  # (was inline ReactFlow setup)
```

**Rule summary per folder:** everything inside `features/<name>/` belongs, in exactly one layer:
`ui/` (pages+components) → `hooks/` → `store/` → `services/`. Shared shell and primitives live in `shared/`. Only `app/` composes providers and routes.

---

## 3. Old → New File Mapping

| Old file | New location | Change |
|----------|--------------|--------|
| `src/main.tsx` | `src/app/main.tsx` | move |
| `src/App.tsx` | `src/app/App.tsx` + `src/app/router.tsx` | move + split routing |
| `src/index.css` | `src/app/styles/index.css` | move |
| `src/components/Sidebar.tsx` | `src/shared/components/layout/Sidebar.tsx` | move |
| `src/components/Navbar.tsx` | `src/shared/components/layout/Navbar.tsx` | move |
| `src/layouts/MainLayout.tsx` | `src/shared/components/layout/MainLayout.tsx` | move |
| `src/context/AnalysisContext.tsx` | 🔀 **split into 4 files** (the big one):<br>→ `analysis/services/analysis.api.ts` (API)<br>→ `analysis/services/analysis.mapper.ts` (transform)<br>→ `analysis/store/analysis.store.tsx` (State)<br>→ `analysis/hooks/useRepositoryAnalysis.ts` + `useAnalysis.ts` (Hooks) | **split by layer** |
| `src/data/mockDashboardData.ts` | `src/shared/data/mockDashboardData.ts` | move (kept as fixtures) |
| `src/types/dashboard.ts` | `src/shared/types/dashboard.ts` (UI models)<br>+ `analysis/services/analysis.dto.ts` (backend DTOs) | split by concern |
| `src/pages/LandingPage.tsx` | `analysis/ui/pages/LandingPage.tsx` | move + remove inline axios |
| `src/pages/LoadingPage.tsx` | `analysis/ui/pages/LoadingPage.tsx` | move + honest progress |
| `src/pages/DashboardPage.tsx` | `analysis/ui/pages/DashboardPage.tsx` + `analysis/ui/components/*` | move + decompose inline blocks |
| `src/pages/RepositoryStructurePage.tsx` | `analysis/ui/pages/RepositoryStructurePage.tsx` + `FolderExplorer.tsx` / `CodeViewer.tsx` | move + split |
| `src/pages/AIInsightsPage.tsx` | `analysis/ui/pages/AIInsightsPage.tsx` + `InsightCard.tsx` | move + split |
| `src/pages/DependencyGraphPage.tsx` | `analysis/ui/pages/DependencyGraphPage.tsx` + `dependencyGraph/*` | move + split (dedupe dagre) |
| `src/pages/CodeAnalysisPage.tsx` | `code/ui/pages/CodeAnalysisPage.tsx` + `code/ui/components/*` | move to its own feature |
| `src/pages/AIChatPage.tsx` | `chat/ui/pages/ChatPage.tsx` + `chat/ui/components/*` | move to its own feature |
| `src/pages/ArchitecturePage.tsx` | `architecture/ui/pages/ArchitecturePage.tsx` + `architecture/*` | move to its own feature |
| *(new)* | `shared/components/ui/Card.tsx`, `Badge.tsx`, `Spinner.tsx`, `EmptyState.tsx`, `CopyButton.tsx` | new shared primitives |
| *(new)* | `shared/hooks/useDebounce.ts`, `shared/lib/repoUrl.ts`, `shared/lib/cn.ts` | new shared utils |
| *(new)* | `app/router.tsx` | new |

---

## 4. The 4 Layers — Applied to CodeAstra

### UI layer (`features/*/ui/`)
**May:** render, collect input, call hooks, show `isLoading`/`error`, navigate.
**Must NOT:** import axios, call the backend, build state, do "quick fallback" generation.

```tsx
// analysis/ui/pages/LandingPage.tsx (target shape)
const { analyzeRepository } = useRepositoryAnalysis();
const handleSubmit = (e) => { e.preventDefault(); analyzeRepository(inputUrl); navigate('/loading'); };
```

### Hooks layer (`features/*/hooks/`) — the "manager"
**Coordinates:** get intent from UI → call API → write State → expose `{ loading, error, data, action() }`.

```tsx
// analysis/hooks/useRepositoryAnalysis.ts (target shape)
export function useRepositoryAnalysis() {
  const { setRepoUrl, setAnalysisData, setIsLive, setStatus, setError } = useAnalysisStore();
  const analyzeRepository = useCallback(async (url: string, opts?: { force?: boolean }) => {
    setStatus('loading'); setError(null);
    try {
      const raw = await analysisApi.analyseRepository(url, opts);   // → API layer
      setAnalysisData(analysisMapper.toDashboard(raw, url));        // → normalization result
      setIsLive(true); setStatus('success');
    } catch (err) {
      setError(apiErrorToMessage(err)); setStatus('error');          // UI decides what to show
    }
  }, []);
  return { analyzeRepository, reAnalyze: (u) => analyzeRepository(u, { force: true }) };
}
```

### State layer (`features/*/store/*.store.tsx`) — the "whiteboard"
**Stores only:** data, derived values, setters. No fetch, no async, no navigation, no try/catch.

```tsx
// analysis/store/analysis.store.tsx (target shape — pure storage)
export interface AnalysisStoreState {
  repoUrl: string;
  analysisData: DashboardData | null;
  isLive: boolean;          // real API result vs sample preview
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  // setters — exported for hooks + store provider only
}
```

`isLive` is a derived-ish safety flag: the UI shows "Preview / Sample" styling whenever `!isLive`.

### API layer (`features/*/services/`) — pure infrastructure
**Does:** HTTP, base URL, timeout, response *and* error normalization. **Does NOT:** state, navigation, hooks, UI.

```ts
// analysis/services/http.client.ts (target shape)
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000',
  timeout: 30_000,
});
http.interceptors.response.use(
  (res) => res.data,
  async (err) => { /* normalize errors → ApiError with message only */ },
);

// analysis/services/analysis.api.ts
export const analysisApi = {
  analyseRepository: async (repoUrl: string, opts?: { force?: boolean }) => {
    const data = await http.post('/api/analysis', { repoUrl, ...opts });
    return data as RawAnalysisResult;      // m1/m2/m3 typed DTO
  },
};
```

---

## 5. Request Flow in the New Architecture (Analyze Repository)

```
User clicks Analyze (LandingPage — UI)
    ↓
UI calls useRepositoryAnalysis().analyzeRepository(url)      ← Hooks
    ↓
Hook sets status=loading, error=null                          ← State
    ↓
Hook calls analysisApi.analyseRepository(url)                ← API
    ↓
API normalizes response via analysis.mapper (raw m1/m2/m3 → DashboardData)
    ↓
Hook writes analysisData + isLive + status into analysis.store   ← State
    ↓
State re-renders → UI shows real data (or an honest error/preview state)
```

Every layer does exactly one thing. No skipping.

---

## 6. Strict Layer Rules — Enforced in This Restructure

| Layer | May talk to | Must NOT |
|-------|-------------|----------|
| `ui/` | `hooks/` | import `services/`, `store/`, axios, fetch |
| `hooks/` | `store/` (setters + read) + `services/` (API) | render JSX, hold API infra, store data itself |
| `store/` | nothing (pure state) | axios, fetch, async, navigation, toasts |
| `services/` | backend only | React hooks, state updates, navigation, UI errors |

> Enforcement (my touch): add ESLint import-boundary rules (`eslint-plugin-import` / `boundaries`) so a bad import fails the build — the structure stays clean by CI, not by discipline.

---

## 7. My Touch — Correctness & UX Fixes Folded Into the Restructure

These come from analyzing the current frontend; each one lives somewhere specific in the new tree.

| # | Fix | Where it lands |
|---|-----|----------------|
| 1 | **Single API client** — kill the two hardcoded ports (`:4000` in LandingPage, `:5000` in context) and the raw-string body bug. Base URL from `VITE_API_BASE_URL` (see `depolyment.md`), one `http.client.ts`. | `analysis/services/http.client.ts` |
| 2 | **Remove inline `axios` from LandingPage** — UI no longer knows the backend. | `analysis/ui/pages/LandingPage.tsx` |
| 3 | **Honest error state** — `error` was never set; now `status: error` + `error` message are real and surfaced via `EmptyState`/banner. | `store` + `shared/components/ui/EmptyState.tsx` |
| 4 | **`isLive` flag** — dashboard shows "Sample/Preview data" whenever data didn't come from the API. | `analysis/store/analysis.store.tsx` |
| 5 | **Deterministic fallbacks** — remove `Math.random()` (`filesCount`, `totalFiles`); derive counts from real `m1` data or stable defaults. | `analysis/services/analysis.mapper.ts` |
| 6 | **No fake progress** — LoadingPage waits on the real analysis promise (or a visible status); fake steps become stage labels driven by actual state transitions. | `analysis/ui/pages/LoadingPage.tsx` |
| 7 | **Working Re-analyze** — Navbar input bound to `repoUrl`; button calls `reAnalyze()` which passes `{ force: true }` (backed by a backend `force` param) so cached clones don't return stale results. | `shared/components/layout/Navbar.tsx` + `useRepositoryAnalysis.ts` + `analysis.api.ts` |
| 8 | **Wired searches & selection** — RepositoryStructure search (with `useDebounce`) filters folders; tree selection shows the folder's real `purpose/explanation` from `m1`. | `analysis/ui/components/FolderExplorer.tsx` + `shared/hooks/useDebounce.ts` |
| 9 | **Wired graph search** — node filtering by label + viewport focus. | `analysis/ui/components/dependencyGraph/*` |
| 10 | **Honest chat** — "Model Active" badge removed until a real `chat.api.ts` exists; page shows a disabled "coming soon" input OR is wired to the new endpoint. | `chat/ui/*` |
| 11 | **Clean mock copy** — replace garbled fallback strings; sample data clearly labeled as sample. | `shared/data/mockDashboardData.ts` |
| 12 | **Dedup StrictMode double-fetch** — orchestration in the hook guards in-flight requests (same-URL dedupe), instead of the context doing fire-and-forget in a `useEffect`. | `analysis/hooks/useRepositoryAnalysis.ts` |
| 13 | **Typed backend contract** — `analysis.dto.ts` mirrors `IAnalysisResult`; no more `raw: any` / `CustomNode data: any`. | `analysis/services/analysis.dto.ts` |
| 14 | **Accessibility** — `aria-label`s on icon-only buttons (Sidebar/`Settings`/bell/copy/X), `focus-visible` tooltips, `role="status"` for loading/error. | `shared/components/**` |
| 15 | **Empty/first-visit state** — dashboard shows "enter a repo URL to begin" (via `EmptyState`) instead of silently rendering the React sample. | `analysis/ui/pages/DashboardPage.tsx` + `EmptyState.tsx` |
| 16 | **Extracted reusable graph** — the dagre + ReactFlow setup duplicated in `DashboardPage` & `DependencyGraphPage` becomes one `DependencyGraphCanvas` (correct-by-construction, single place to fix). | `analysis/ui/components/dependencyGraph/` |
| 17 | **One source of URL parsing** — `parseGitHubUrl()` (currently inside context) → pure `repoUrl.ts`, unit-testable. | `shared/lib/repoUrl.ts` |

---

## 8. Migration Plan (Phases)

| Phase | Work | Outcome |
|-------|------|---------|
| **1 — Base & shared** | Create `app/`, `shared/`; move `main.tsx`, `App.tsx`, `index.css`, layout components, mock data, types. Run build. | App boots from new shell, UI identical. |
| **2 — Feature skeletons** | Create `features/{analysis,chat,code,architecture}/…`; move pages 1:1 into their feature `ui/pages/`. | No behavior change; structure now feature-based. |
| **3 — API layer** | Create `http.client.ts`, `analysis.api.ts`, `analysis.dto.ts`, `analysis.mapper.ts` (move `transformAnalysisResult` + fix determinism + typed DTO). | Backend knowledge contained in `services/`. |
| **4 — State split** | Rebuild `analysis.store.tsx` as passive state (values + setters + `isLive`/`status`). | `AnalysisContext` god-file is gone. |
| **5 — Hooks layer** | Add `useAnalysis` (read) + `useRepositoryAnalysis` (orchestrate: loading/error, in-flight dedupe, `force` re-analyze). | UI → Hook → API → Store flow fully wired. |
| **6 — UI cleanup** | Pages call hooks only; delete inline axios; LandingPage simplified; LoadingPage honest; Navbar Re-analyze wired; searches wired. | User-facing correctness land (items 2–11). |
| **7 — Extraction & polish** | Extract Dashboard/DependencyGraph/RepositoryStructure inline blocks into feature components; add `EmptyState`, a11y labels, ESLint boundary rules. | Items 12–17; structure stays clean via CI. |
| **8 — Build & verify** | `npm run build` (tsc -b + vite build), `npm run lint`. | No TypeScript errors, lint clean. |

---

## 9. Target Routing (unchanged user paths)

```
/               → analysis/ui/pages/LandingPage.tsx
/loading        → analysis/ui/pages/LoadingPage.tsx
/dashboard      → analysis/ui/pages/DashboardPage.tsx
/repository     → analysis/ui/pages/RepositoryStructurePage.tsx
/code           → code/ui/pages/CodeAnalysisPage.tsx
/insights       → analysis/ui/pages/AIInsightsPage.tsx
/graph          → analysis/ui/pages/DependencyGraphPage.tsx
/chat           → chat/ui/pages/ChatPage.tsx
/architecture   → architecture/ui/pages/ArchitecturePage.tsx
```

Route declarations move to `app/router.tsx`; `App.tsx` stays a thin composition of `Providers → Router → MainLayout`.

---

## 10. Final Rule of Thumb (from `react-architecture.md`, now true for CodeAstra)

> **UI renders. Hooks coordinate. State stores. API talks to the backend.**
>
> * UI imports only hooks.
> * Hooks import state + API.
> * State imports nothing (pure storage).
> * API imports only the backend.
>
> No skipping layers.

Every file in the new tree above can be dropped onto this sentence and pass — that is the restructure's contract.