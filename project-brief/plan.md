# CodeAstra — Change Plan

> **How to use this file:** This is *your* working doc. I propose changes here; you edit, reorder, delete, or add notes/comments to make it your way. Add your thoughts under any item as `> NOTE (you): ...`. I read this before touching code and only act on items you've approved.
>
> **Status legend:** `[ ]` proposed · `[~]` approved, in progress · `[x]` done · `[-]` dropped
>
> **Guiding principle:** smallest change that actually fixes the root cause. No new dependencies or abstractions unless an item explicitly calls for one.

---

## Priority 1 — Correctness / "the app actually works end to end"

### [ ] P1.1 — Fix the API base URL mismatch (one source of truth)
- **Problem:** context posts to `:5000`, `LandingPage` has a leftover axios call to `:4000` sending a raw string, backend is `:4000`.
- **Proposed fix:** add `VITE_API_BASE_URL` (fallback `http://localhost:4000`); make `AnalysisContext` the only caller; delete the leftover `repoAnalysis()` in `LandingPage`.
- **Touches:** `features/analysis/context/AnalysisContext.tsx`, `features/analysis/pages/LandingPage.tsx`, `frontend/.env`.
- **Size:** small.
> NOTE (you):

### [ ] P1.2 — Set `error` state + add `isLive` flag
- **Problem:** failures silently fall back to mock; users can't tell real from placeholder.
- **Proposed fix:** set `error` on fetch fail / `success:false`; expose `isLive` boolean; small banner when `!isLive`.
- **Touches:** `AnalysisContext.tsx`, one banner in `MainLayout` or `DashboardPage`.
- **Size:** small.
> NOTE (you):

### [ ] P1.3 — Remove `Math.random()` from `transformAnalysisResult`
- **Problem:** dashboard numbers change between renders.
- **Proposed fix:** deterministic fallbacks (folder count from `m1`, `0`/"—" when unknown).
- **Touches:** `AnalysisContext.tsx`.
- **Size:** tiny.
> NOTE (you):

### [ ] P1.4 — Fix StrictMode double-fetch
- **Problem:** `LoadingPage` `useEffect` fires `analyzeRepo` twice in dev → duplicate backend calls (costs LLM tokens).
- **Proposed fix:** dedupe in-flight request in context (guard by `status`), or abort-on-cleanup in the effect.
- **Touches:** `AnalysisContext.tsx`, `LoadingPage.tsx`.
- **Size:** small.
> NOTE (you):

---

## Priority 2 — Finish what's half-done

### [ ] P2.1 — Complete the 4-layer split
- **Problem:** `hooks/useAnalysis.ts` and `services/analysis.api.ts` are empty; fetch+transform still in context.
- **Proposed fix:** move the `fetch` + `transformAnalysisResult` into `services/analysis.api.ts`; keep context as state-only; re-export `useAnalysis` from `hooks/`.
- **Touches:** `AnalysisContext.tsx`, `services/analysis.api.ts`, `hooks/useAnalysis.ts`.
- **Size:** medium. *(Only worth doing if we're committed to the 4-layer model — otherwise drop the empty files instead.)*
> NOTE (you):

### [ ] P2.2 — Make "Re-analyze" (Navbar) functional + `force` re-run
- **Problem:** Navbar URL bar + button are non-functional; backend cache returns stale result for same URL.
- **Proposed fix:** bind input to `repoUrl`, button → `analyzeRepo()` + navigate; add `force` flag to `POST /api/analysis` to bypass cache.
- **Touches:** `Navbar.tsx`, `AnalysisContext.tsx`, `analysis.controller.ts`, `analysis.dao.ts`.
- **Size:** medium.
> NOTE (you):

---

## Priority 3 — Backend hardening (do before any real deployment)

### [ ] P3.1 — Validate `repoUrl` (Zod, GitHub-domain check) — small.
### [ ] P3.2 — Restrict CORS to the frontend origin — tiny.
### [ ] P3.3 — Rate-limit `POST /api/analysis` (express-rate-limit) — small, adds 1 dep.
### [ ] P3.4 — A few tests: parser.service + controller happy/error path — medium.
### [ ] P3.5 — Fix `result.m3` schema mismatch — tiny.
- **Problem:** `repoAnalysis.model.ts` declares `result.m3` as an array (`[DependencyNodeSchema]`), but runtime `m3` is an object `{ graph, formattedAscii }`. `formattedAscii` is never persisted; cached reads may be malformed.
- **Proposed fix:** make the stored `m3` an object schema `{ graph: [DependencyNodeSchema], formattedAscii: String }`.
- **Touches:** `backend/src/models/repoAnalysis.model.ts`.
> NOTE (you):

---

## Priority 4 — Honesty / polish (low)

### [ ] P4.1 — Label static pages (Chat, CodeAnalysis, Architecture) as "Preview/Coming soon" so a static UI never looks live.
### [ ] P4.2 — Wire the DependencyGraph + RepositoryStructure search boxes (currently do nothing).
### [ ] P4.3 — Refresh `.docs/FRONTEND_FLOW_AND_IMPROVEMENTS.md` to the `features/` paths.
> NOTE (you):

---

## Parking lot (ideas, not scheduled)
- Backend "B-modules" (tech-stack summary, critical files, request lifecycle) so the dashboard stops hardcoding them.
- Real chat endpoint reusing M2/M3 context.
- On-demand file-content route so RepositoryStructure shows real code.
> NOTE (you):

---

## Open questions for you
1. Are we committed to the 4-layer frontend model (finish P2.1), or should the empty `hooks/`/`services/` files just be deleted?
2. Is deployment near-term? That decides whether P3 jumps in priority.
3. Any of P1 you want me to just do now vs. wait for your review?
> ANSWERS (you):
