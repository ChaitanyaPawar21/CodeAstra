# Frontend Architecture & State Management Context

## Analysis Feature Architecture

The Analysis feature follows a strict 3-tier separation of concerns:
1. **API Service (`features/analysis/services/analysis.api.ts`)**
   - Pure HTTP client built on Axios (`apiInstance`) with `withCredentials: true`.
   - Sends `{ repoUrl }` to `POST /api/analysis`.
   - Supports `options.signal` for request aborts.

2. **Shared State & Context (`features/analysis/context/AnalysisContext.tsx`)**
   - Holds shared reactive state: `repoUrl`, `analysisData`, `isLoading`, `error`, `resetAnalysis`.
   - Houses shared request synchronization refs: `activeRequestIdRef` and `abortControllerRef`.
   - Session isolation: Tracks `currentUserId` from `useAuth()`. When user logs out or switches accounts, immediately aborts in-flight requests, increments the request counter to discard delayed responses, and wipes analysis data/errors.
   - Provides deterministic data transformation via `transformReal`.
   - Exposes `useAnalysisContext()`.

3. **Workflow Orchestration Hook (`features/analysis/hooks/useAnalysis.ts`)**
   - Coordinates between `analysisApi` and `AnalysisContext`.
   - Handles async lifecycle with cancellation (`AbortController`) on newer requests or session changes.
   - Ensures only the latest active request ID can commit state updates or reset loading status.
   - Catches 401 unauthenticated errors and dispatches `UNAUTHORIZED_EVENT`.
   - Consumed by all UI pages and layout components.

## UI Integration Map
All UI consumers import `useAnalysis` directly from `features/analysis/hooks/useAnalysis`:
- `features/analysis/pages/LandingPage.tsx`
- `features/analysis/pages/LoadingPage.tsx`
- `features/analysis/pages/DashboardPage.tsx`
- `features/analysis/pages/ArchitecturePage.tsx`
- `features/analysis/pages/AIInsightsPage.tsx`
- `features/analysis/pages/DependencyGraphPage.tsx`
- `features/analysis/pages/RepositoryStructurePage.tsx`
- `features/code/pages/CodeAnalysisPage.tsx`
- `features/chat/pages/AIChatPage.tsx`
- `shared/components/layouts/Navbar.tsx`
- `shared/components/layouts/MainLayout.tsx`
