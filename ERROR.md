# Error & Issue Analysis Report

> **Project:** CodeAstra Backend  
> **Analysis Date:** 2026-09-07  
> **Method:** Static code analysis (no runtime execution - credentials unavailable)  
> **Status:** Issues documented, NOT FIXED per instructions

---

## 1. Critical Runtime Errors (Will Crash Server)

| # | Location | Error Type | Description | Trigger Condition |
|---|----------|------------|-------------|-------------------|
| 1 | `src/config/config.ts:4-18` | **Uncaught Exception** | Throws raw `Error` if env vars missing - crashes on startup | Missing PORT, MONGO_URI, GITHUB_TOKEN, or GROQ_API_KEY |
| 2 | `src/config/db.ts:9-10` | **Process Exit** | `process.exit(1)` on MongoDB connection failure | MongoDB unavailable, wrong URI, network issues |
| 3 | `src/ai/model.ts:4-22` | **Uncaught Exception** | ChatGroq instantiation fails if GROQ_API_KEY invalid | Invalid/expired Groq API key |
| 4 | `src/services/github.service.ts:64-66` | **Auth Failure** | Octokit created with undefined auth if GITHUB_TOKEN missing | GitHub token not set or invalid |

---

## 2. Unhandled Promise Rejections (Silent Failures)

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 5 | `src/services/github.service.ts:101-127` | `getRepoTree` catches error but throws new Error - caller must catch | If uncaught, crashes Node process |
| 6 | `src/services/github.service.ts:154-176` | `getFileContent` throws on 404/403 - no retry logic | Rate limits, private repos, deleted files crash batch |
| 7 | `src/services/github.service.ts:178-215` | `getSourceFiles` Promise.all with no try/catch wrapper | One failed file fails entire batch silently |
| 8 | `src/services/parser.service.ts:169-188` | `parseRepo` swallows parse errors with console.warn only | Malformed files skipped silently, no tracking |
| 9 | `src/services/ai.service.ts:49-97` | `analyseRepository` returns error object but doesn't throw | Controller handles, but internal errors lost |
| 10 | `src/ai/analysis.graph.ts:39-77` | `runAnalysisGraph` catches all errors, returns error object | Graph compilation errors hidden in result |

---

## 3. API Endpoint Issues (`POST /api/analysis`)

| # | Location | Issue | Severity |
|---|----------|-------|----------|
| 11 | `src/controllers/analysis.controller.ts:7-12` | **No URL validation** - only checks string type | Accepts "not-a-url", "http://evil.com", empty strings |
| 12 | `src/controllers/analysis.controller.ts:14-17` | **SHA256 hash collision risk** - no salt, direct URL hash | Different URLs could theoretically collide (low probability) |
| 13 | `src/controllers/analysis.controller.ts:19-29` | **Cache lookup error swallowed** - logs but continues | DB error during cache check → proceeds to create duplicate |
| 14 | `src/controllers/analysis.controller.ts:36-49` | **DB create error returns 500** but doesn't clean up | Failed record creation leaves no trace, retry creates new jobId |
| 15 | `src/controllers/analysis.controller.ts:51` | **Type assertion unsafe** - `(record._id as string).toString()` | If _id not string (ObjectId), throws at runtime |
| 16 | `src/controllers/analysis.controller.ts:53` | **No timeout on AI pipeline** - can hang indefinitely | Long repos, slow LLM, network issues → request timeout |
| 17 | `src/controllers/analysis.controller.ts:55-65` | **AI errors joined with " | "** - loses structure | Frontend can't parse individual error types |
| 18 | `src/controllers/analysis.controller.ts:67` | **markCompleted called even if result partial** | Success=true even if M1/M2/M3 had errors (check combine node) |

---

## 4. AI Pipeline Issues (LangGraph)

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 19 | `src/ai/nodes/m1Folder.node.ts:18-24` | **Folder extraction loses nested context** - `slice(0,-1)` removes file name | `src/utils/helpers.js` → `src/utils` loses file-level hints |
| 20 | `src/ai/nodes/m1Folder.node.ts:26-28` | **Empty folderPaths returns error but continues** | Graph proceeds with empty M1 result, combine handles |
| 21 | `src/ai/nodes/m2EntryPoint.node.ts:30-37` | **Hardcoded ENTRY_CANDIDATES duplicates github.service.ts** | Drift risk - update in two places |
| 22 | `src/ai/nodes/m2EntryPoint.node.ts:49-58` | **Fallback content extraction broken** - uses `parsed.functions.join(", ")` | Entry content becomes "func1, func2, func3" not actual code |
| 23 | `src/ai/nodes/m2EntryPoint.node.ts:50-58` | **Type assertion `as Array<...>` hides type errors** | If filter returns wrong type, runtime crash |
| 24 | `src/ai/nodes/m3Dependency.node.ts:9` | **Hardcoded MAX_FILES_FOR_LLM = 40** - not configurable | Large repos truncated arbitrarily |
| 25 | `src/ai/nodes/m3Dependency.node.ts:27-30` | **Import filtering only keeps relative imports** - `startsWith(".") || startsWith("/")` | Misses internal aliases like `@/utils`, `~/components` |
| 26 | `src/ai/nodes/combine.node.ts:15-17` | **Error checking only null, not empty arrays** | `m1Result: []` passes, `m1Result: null` fails - inconsistent |
| 27 | `src/ai/analysis.graph.ts:45-54` | **Initial state requires all fields** - verbose, error-prone | Adding new state field requires updating invoke call |
| 28 | `src/ai/state.ts:41-44` | **Error reducer accumulates but never clears** | Multiple graph runs (if reused) accumulate old errors |

---

## 5. GitHub Service Issues

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 29 | `src/services/github.service.ts:24-35` | **Skip_Dirs hardcoded** - misses `target`, `bin`, `obj`, `vendor`, `.idea` | Java/Rust/Go build dirs not filtered |
| 30 | `src/services/github.service.ts:37-44` | **Source_Extensions misses** - `.go`, `.rs`, `.php`, `.rb`, `.cs`, `.kt`, `.swift` | Non-JS/Python/Java repos return empty |
| 31 | `src/services/github.service.ts:46-58` | **Entry_Candidates misses** - `manage.py`, `wsgi.py`, `asgi.py`, `cmd/main.go`, `main.rs` | Django, Go, Rust entry points not detected |
| 32 | `src/services/github.service.ts:60-62` | **Hardcoded limits** - MAX_FILES=60, BATCH_SIZE=5, RATE_DELAY=100ms | Not tunable for large repos or rate limit tiers |
| 33 | `src/services/github.service.ts:103-108` | **`tree_sha: "HEAD"` assumes default branch** | Fails if default branch is `main`, `trunk`, `develop` |
| 34 | `src/services/github.service.ts:115-117` | **Filter mutates response** - `shouldSkip` uses `.some()` on split | Paths like `my-node_modules/file.js` incorrectly skipped |
| 35 | `src/services/github.service.ts:154-176` | **No pagination for large files** - `getContent` fails on >1MB | Large source files (minified, generated) cause 403/422 |
| 36 | `src/services/github.service.ts:194-203` | **Promise.all with no concurrency limit beyond BATCH_SIZE** | If BATCH_SIZE increased, hits GitHub secondary rate limit |

---

## 6. Parser Service Issues

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 37 | `src/services/parser.service.ts:25-32` | **Lang_Map misses** - `.mjs`, `.cjs`, `.mts`, `.cts`, `.vue`, `.svelte`, `.astro` | Modern JS variants parsed as "unknown" |
| 38 | `src/services/parser.service.ts:49` | **Static import regex misses** - `import type`, `import { type }` | Type-only imports not captured |
| 39 | `src/services/parser.service.ts:51` | **Require regex misses** - `require('./path')` without parens, dynamic require | CommonJS dynamic requires missed |
| 40 | `src/services/parser.service.ts:53` | **Re-export regex misses** - `export { foo } from 'bar'`, `export default from` | Named re-exports not captured |
| 41 | `src/services/parser.service.ts:62-65` | **Export regex misses** - `export { foo, bar }`, `export const foo = 1, bar = 2` | Only captures first identifier in multi-export |
| 42 | `src/services/parser.service.ts:68-73` | **Function regex misses** - arrow functions not assigned to const, methods, getters/setters | Class methods, object methods, getters not captured |
| 43 | `src/services/parser.service.ts:90-97` | **Python import regex misses** - `import x.y.z`, `from x import y as z`, relative imports | Complex imports not fully captured |
| 44 | `src/services/parser.service.ts:100` | **Python function regex misses** - `async def`, decorators `@property`, nested functions | Decorated functions, async functions missed |
| 45 | `src/services/parser.service.ts:121-135` | **Java parser very basic** - misses static imports, wildcard imports, generics | `import static`, `import pkg.*`, `<T>` not handled |
| 46 | `src/services/parser.service.ts:145-167` | **No error context in parseSingleFile** - filePath not in catch block | Can't identify which file caused parse error |

---

## 7. Data Model Issues

| # | Location | Issue | Impact |
|---|----------|-------|--------|
| 47 | `src/models/repoAnalysis.model.ts:100-106` | **userId optional but ref="User"** - no User model exists | Populate will fail, reference dangling |
| 48 | `src/models/repoAnalysis.model.ts:129-133` | **result schema embedded** - not separate subdocument | Can't query M1/M2/M3 independently, large docs |
| 49 | `src/models/repoAnalysis.model.ts:146-152` | **Indexes created on every model init** - no `background: true` | Blocks writes during index build in production |
| 50 | `src/models/repoAnalysis.model.ts:112-117` | **repoUrlHash unique: false but used for cache lookup** | Multiple records per URL possible, cache returns first |

---

## 8. Security Vulnerabilities

| # | Location | Vulnerability | Severity |
|---|----------|---------------|----------|
| 51 | `src/app.ts:11` | **CORS allows all origins** - `app.use(cors())` no options | CSRF, data exfiltration from browser |
| 52 | `src/app.ts:8-9` | **No body size limit** - `express.json()` default 100kb but no explicit limit | DoS via large payloads |
| 53 | `src/app.ts` | **No rate limiting** - unlimited requests per IP | API abuse, GitHub token burnout, LLM cost explosion |
| 54 | `src/app.ts` | **No helmet/security headers** - XSS, clickjacking, MIME sniffing | Client-side attacks |
| 55 | `src/controllers/analysis.controller.ts:7` | **No authentication/authorization** - public endpoint | Anyone can analyze any repo, consume resources |
| 56 | `src/services/github.service.ts:64-66` | **GitHub token in Octokit auth** - logged on error if not careful | Token exposure in logs |
| 57 | `src/config/config.ts` | **No validation of MONGO_URI format** - injection possible | MongoDB connection string injection |

---

## 9. TypeScript/Type Safety Issues

| # | Location | Issue |
|---|----------|-------|
| 58 | `src/ai/nodes/m2EntryPoint.node.ts:31` | `state.parsedRepo as EnrichedParsedRepo` - unsafe cast |
| 59 | `src/ai/nodes/m2EntryPoint.node.ts:58` | `.filter(Boolean) as Array<...>` - type assertion hides errors |
| 60 | `src/controllers/analysis.controller.ts:51` | `(record._id as string).toString()` - ObjectId not string |
| 61 | `src/services/github.service.ts:185` | `filePath is string ✓` comment but no type guard |
| 62 | `src/ai/analysis.graph.ts:56` | `(finalState as any).combined` - any defeats type safety |
| 63 | `src/services/parser.service.ts:149` | `parsed` variable implicit any in switch default |

---

## 10. Configuration & Environment Issues

| # | Location | Issue |
|---|----------|-------|
| 64 | `package.json:5` | `"main": "server.ts"` but `"dev": "tsx watch server.ts"` - no build script |
| 65 | `package.json:8` | `"test": "echo \"Error: no test specified\" && exit 1"` - no tests |
| 66 | Root | **No `.env.example`** - onboarding requires guessing env vars |
| 67 | `src/config/config.ts` | **No default PORT fallback** - throws if not set (line 4-6) |
| 68 | `src/config/config.ts:16-18` | **GROQ_API_KEY required but Google GenAI also in deps** - unused dependency |

---

## 11. Missing Features (From Requirements)

| # | Feature | Spec Reference | Status |
|---|---------|----------------|--------|
| 69 | **B1 - Critical File Identification** | `docs/feature.md:46` | ❌ Not implemented |
| 70 | **B2 - Execution Flow Explanation** | `docs/feature.md:47` | ❌ Not implemented |
| 71 | **B3 - Intelligent Repository Summary** | `docs/feature.md:48` | ❌ Not implemented |
| 72 | **Supported: React, Python, Java, Full-stack** | `docs/feature.md:53-54` | ⚠️ Partial (parser gaps) |
| 73 | **Working demo accepting GitHub URL** | `docs/feature.md:59` | ⚠️ Backend only, no frontend |
| 74 | **5-minute presentation** | `docs/feature.md:61` | ❌ Not created |

---

## 12. Test Repository Scenarios (Predicted Failures)

| Test Case | Predicted Error | Root Cause |
|-----------|----------------|------------|
| **Empty repo** | M1: "No folders found", M2: "No entry candidates", M3: "No files to map" | No graceful empty state handling |
| **Monorepo (multiple package.json)** | M1: Confuses apps/packages, M2: Multiple entry points | No monorepo detection |
| **Private repo (no token access)** | 404/403 from GitHub API, uncaught in getRepoTree | No auth validation before fetch |
| **Huge repo (10k+ files)** | Timeout, memory issues, GitHub rate limit | No pagination, hardcoded 60 file limit |
| **Non-GitHub URL (GitLab, Bitbucket)** | `parseRepoUrl` throws "Invalid GitHub repository URL" | No multi-provider support |
| **Repo with only config files (no source)** | Parser returns empty, AI gets empty ParsedRepo | No validation of parsed output |
| **Binary/large files in repo** | `getFileContent` fails on base64 decode or size | No file size/type checking |
| **Malformed code (syntax errors)** | Regex parsers produce wrong output, LLM gets garbage | No syntax validation, regex-only parsing |

---

## 13. Dependency Issues

| # | Package | Issue |
|---|---------|-------|
| 75 | `@langchain/google-genai` | Installed but unused (using Groq only) |
| 76 | `axios` | Installed but Octokit handles HTTP, unused |
| 77 | `express@^5.2.1` | Version 5 is beta/RC - breaking changes likely |
| 78 | `typescript@^7.0.2` | Version 7 not released (current 5.x) - invalid version |
| 79 | `@types/node@^26.1.2` | Node 26 not released (current 20.x) - invalid version |

---

## 14. Code Smells & Technical Debt

| # | Location | Smell |
|---|----------|-------|
| 80 | `src/services/github.service.ts` | **God service** - 226 lines, 10+ responsibilities |
| 81 | `src/services/parser.service.ts` | **Switch statement parsing** - not extensible, add language = modify core |
| 82 | `src/ai/nodes/*.node.ts` | **Duplicate LLM invocation pattern** - no base class/util |
| 83 | `src/ai/prompts/*.ts` | **Prompt strings in code** - not externalized, hard to version |
| 84 | `src/controllers/analysis.controller.ts` | **Controller does too much** - validation, caching, orchestration, response |
| 85 | Multiple files | **Magic numbers** - 60, 5, 100, 40, 800, 3 scattered |
| 86 | Multiple files | **Console.log for logging** - no levels, no structure, no rotation |

---

## 15. Summary Statistics

| Category | Count |
|----------|-------|
| Critical Runtime Errors | 4 |
| Unhandled Promise Rejections | 6 |
| API Endpoint Issues | 8 |
| AI Pipeline Issues | 10 |
| GitHub Service Issues | 8 |
| Parser Service Issues | 10 |
| Data Model Issues | 4 |
| Security Vulnerabilities | 7 |
| TypeScript Issues | 6 |
| Config/Environment Issues | 5 |
| Missing Features | 6 |
| Dependency Issues | 5 |
| Code Smells | 7 |
| **Total Issues Identified** | **86** |

---

## 16. Recommended Testing Approach (When Credentials Available)

```bash
# 1. Start MongoDB
docker run -d -p 27017:27017 mongo:7

# 2. Create .env with valid credentials
cp .env.example .env
# Edit with real values

# 3. Run server
cd backend && npm run dev

# 4. Test with various repos
curl -X POST http://localhost:4000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/expressjs/express"}'

# 5. Check response structure, errors, latency
# 6. Test edge cases from Section 12
```

---

*This document captures issues found via static analysis. Runtime testing with valid credentials will likely reveal additional issues. **No fixes applied per instructions.***