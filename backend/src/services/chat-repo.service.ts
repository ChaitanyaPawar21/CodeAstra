
import { Octokit } from "@octokit/rest";
import { config } from "../config/config.js";
import {
  parseRepoUrl,
  type RepoMeta,
} from "./github.service.js";

// ==================================================
// INTERFACES
// ==================================================

export interface ChatRepoFile {
  path: string;
  content: string;
}

export interface ChatRepoContext {
  owner: string;
  repo: string;
  branch: string;
  totalFiles: number;
  allPaths: string[];
  folderStructure: string[];
  files: ChatRepoFile[];
  truncated: boolean;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface ScoredFile {
  path: string;
  score: number;
}

// ==================================================
// GITHUB CONFIGURATION
// ==================================================

const octokit = new Octokit({
  auth: config.GITHUB_TOKEN || undefined,
});

// ==================================================
// CACHE CONFIGURATION
// ==================================================

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 300;
const MAX_RECENT_FILES = 8;

const repositoryCache = new Map<
  string,
  CacheEntry<unknown>
>();

const getCache = <T>(key: string): T | undefined => {
  const entry = repositoryCache.get(key);

  if (!entry) {
    return undefined;
  }

  if (Date.now() >= entry.expiresAt) {
    repositoryCache.delete(key);
    return undefined;
  }

  // Move accessed entry to the end for LRU ordering.
  repositoryCache.delete(key);
  repositoryCache.set(key, entry);

  return entry.value as T;
};

const setCache = <T>(key: string, value: T): void => {
  repositoryCache.delete(key);

  const now = Date.now();

  // Remove expired entries.
  for (const [cacheKey, entry] of repositoryCache.entries()) {
    if (now >= entry.expiresAt) {
      repositoryCache.delete(cacheKey);
    }
  }

  // Remove oldest entries when the cache is full.
  while (repositoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = repositoryCache.keys().next().value;

    if (!oldestKey) {
      break;
    }

    repositoryCache.delete(oldestKey);
  }

  repositoryCache.set(key, {
    value,
    expiresAt: now + CACHE_TTL_MS,
  });
};

const getRepositoryCacheKey = (meta: RepoMeta): string => {
  return `${meta.owner.toLowerCase()}/${meta.repo.toLowerCase()}`;
};

// ==================================================
// FILE SELECTION CONFIGURATION
// ==================================================

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  ".next",
  "out",
  "__pycache__",
  "vendor",
  ".cache",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".json",
  ".html",
  ".css",
  ".scss",
  ".sql",
  ".md",
  ".yml",
  ".yaml",
  ".xml",
]);

const SPECIAL_FILES = new Set([
  "Dockerfile",
  "Makefile",
  ".env.example",
  "package.json",
  "tsconfig.json",
]);

const MAX_FILES = 18;
const MAX_FILE_SIZE = 12000;
const MAX_TOTAL_CHARS = 10000;
const MAX_PER_FILE_CONTEXT_CHARS = 2800;
const MAX_PATHS_IN_CONTEXT = 250;

// ==================================================
// FILE FILTERING
// ==================================================

const hasAllowedFileType = (path: string): boolean => {
  const name = path.split("/").pop() || "";

  if (SPECIAL_FILES.has(name)) {
    return true;
  }

  const dotIndex = name.lastIndexOf(".");

  if (dotIndex === -1) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(
    name.slice(dotIndex).toLowerCase(),
  );
};

const shouldSkipPath = (path: string): boolean =>
  path.split("/").some((segment) =>
    SKIP_DIRS.has(segment),
  );

// ==================================================
// DEFAULT BRANCH FETCHING
// ==================================================

const getDefaultBranch = async (
  meta: RepoMeta,
): Promise<string> => {
  const cacheKey = `branch:${getRepositoryCacheKey(meta)}`;

  const cachedBranch = getCache<string>(cacheKey);

  if (cachedBranch) {
    return cachedBranch;
  }

  const { data } = await octokit.repos.get({
    owner: meta.owner,
    repo: meta.repo,
  });

  const branch = data.default_branch;

  setCache(cacheKey, branch);

  return branch;
};

// ==================================================
// REPOSITORY TREE FETCHING
// ==================================================

interface RepositoryTree {
  files: string[];
  folders: string[];
  truncated: boolean;
}

const getRepositoryTree = async (
  meta: RepoMeta,
  branch: string,
): Promise<RepositoryTree> => {
  const cacheKey =
    `tree:${getRepositoryCacheKey(meta)}:${branch}`;

  const cachedTree = getCache<RepositoryTree>(cacheKey);

  if (cachedTree) {
    return cachedTree;
  }

  const { data: branchData } = await octokit.repos.getBranch({
    owner: meta.owner,
    repo: meta.repo,
    branch,
  });

  const { data: treeData } = await octokit.git.getTree({
    owner: meta.owner,
    repo: meta.repo,
    tree_sha: branchData.commit.sha,
    recursive: "1",
  });

  const files = treeData.tree
    .filter(
      (node) =>
        node.type === "blob" &&
        Boolean(node.path) &&
        !shouldSkipPath(node.path!) &&
        hasAllowedFileType(node.path!),
    )
    .map((node) => node.path!);

  const folders = new Set<string>();

  for (const node of treeData.tree) {
    if (
      node.type === "tree" &&
      node.path &&
      !shouldSkipPath(node.path)
    ) {
      folders.add(node.path);
    }
  }

  const result: RepositoryTree = {
    files: files.sort(),
    folders: [...folders].sort(),
    truncated: treeData.truncated,
  };

  setCache(cacheKey, result);

  return result;
};

// ==================================================
// QUESTION KEYWORD EXTRACTION
// ==================================================

const getQuestionKeywords = (question: string): string[] => {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9_./-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
};

// ==================================================
// RELATED KEYWORD EXTRACTION
// ==================================================

const getRelatedKeywords = (question: string): string[] => {
  const q = question.toLowerCase();

  const keywords = new Set(
    getQuestionKeywords(question),
  );

  const groups: Record<string, string[]> = {
    auth: [
      "auth",
      "authentication",
      "authorization",
      "login",
      "logout",
      "register",
      "jwt",
      "middleware",
      "token",
      "password",
    ],

    chatbot: [
      "chat",
      "chatbot",
      "message",
      "conversation",
      "chat.controller",
      "chat.service",
      "chat.route",
      "chat.api",
      "aichatpage",
      "groq",
    ],

    route: [
      "route",
      "routes",
      "router",
      "endpoint",
      "api",
      "controller",
    ],

    database: [
      "database",
      "db",
      "mongo",
      "mongodb",
      "mongoose",
      "model",
      "schema",
      "connection",
    ],

    frontend: [
      "frontend",
      "react",
      "component",
      "page",
      "hooks",
      "features",
    ],

    backend: [
      "backend",
      "express",
      "server",
      "app",
      "controller",
      "service",
      "middleware",
    ],

    github: [
      "github",
      "octokit",
      "repository",
      "repo",
      "fetch",
      "tree",
    ],
  };

  for (const [group, related] of Object.entries(groups)) {
    if (
      q.includes(group) ||
      related.some((word) => q.includes(word))
    ) {
      related.forEach((word) => keywords.add(word));
    }
  }

  if (q.includes("api")) {
    [
      "route",
      "routes",
      "controller",
      "endpoint",
    ].forEach((word) => keywords.add(word));
  }

  if (
    q.includes("flow") ||
    q.includes("execution") ||
    q.includes("end to end") ||
    q.includes("end-to-end")
  ) {
    [
      "app.ts",
      "index.ts",
      "server.ts",
      "controller",
      "service",
      "route",
      "middleware",
    ].forEach((word) => keywords.add(word));
  }

  return [...keywords];
};

// ==================================================
// QUESTION INTENT DETECTION
// ==================================================

interface QuestionIntent {
  chat: boolean;
  auth: boolean;
  route: boolean;
  middleware: boolean;
  database: boolean;
  frontend: boolean;
  backend: boolean;
  fullFlow: boolean;
}

const detectQuestionIntent = (
  question: string,
): QuestionIntent => {
  const q = question.toLowerCase();

  const chat =
    /\b(chat|chatbot|conversation|groq|ai assistant|messages)\b/.test(q);

  const auth =
    /\b(auth|authentication|authorization|login|logout|register|jwt|token|signup|sign up)\b/.test(q);

  const route =
    /\b(route|routes|router|endpoint|api|mount|mounted|mounting)\b/.test(q);

  const middleware =
    /\b(middleware|protected|authentication|authorization|auth flow)\b/.test(q);

  const database =
    /\b(database|mongodb|mongo|mongoose|schema|model|collection|db connection)\b/.test(q);

  const frontend =
    /\b(frontend|front end|react|page|component|browser|client)\b/.test(q);

  const backend =
    /\b(backend|back end|server|express|controller|service)\b/.test(q);

  const fullFlow =
    /\b(flow|execution|end to end|end-to-end|complete process|request travels|how does.*work|working of)\b/.test(q);

  return {
    chat,
    auth,
    route,
    middleware,
    database,
    frontend,
    backend,
    fullFlow,
  };
};

// ==================================================
// CONNECTED FILE RETRIEVAL
// ==================================================

/**
 * Finds connected files using paths that actually exist
 * in the repository tree.
 *
 * These are retrieval priorities only.
 * The AI must still inspect source code to verify
 * whether the files are actually connected.
 */
const getConnectedFilePaths = (
  paths: string[],
  question: string,
): string[] => {
  const intent = detectQuestionIntent(question);
  const connected = new Set<string>();

  const addMatching = (
    predicate: (path: string) => boolean,
    limit = 3,
  ): void => {
    const matches = paths
      .filter(predicate)
      .sort((a, b) => {
        // Prefer TypeScript/JavaScript application source files.
        const aScore = /\.(ts|tsx|js|jsx)$/.test(a) ? 1 : 0;
        const bScore = /\.(ts|tsx|js|jsx)$/.test(b) ? 1 : 0;

        return bScore - aScore || a.localeCompare(b);
      })
      .slice(0, limit);

    matches.forEach((path) => connected.add(path));
  };

  const isEntryPoint = (path: string): boolean =>
    /(^|\/)(app|server|index)\.(ts|tsx|js|jsx)$/.test(path);

  const isRoute = (path: string): boolean =>
    /(^|\/)[^/]*route[^/]*\.(ts|tsx|js|jsx)$/.test(path) ||
    /(^|\/)routes\/[^/]+\.(ts|tsx|js|jsx)$/.test(path);

  const isController = (path: string): boolean =>
    /(^|\/)[^/]*controller[^/]*\.(ts|tsx|js|jsx)$/.test(path) ||
    /(^|\/)controllers\/[^/]+\.(ts|tsx|js|jsx)$/.test(path);

  const isMiddleware = (path: string): boolean =>
    /(^|\/)middleware\/[^/]+\.(ts|tsx|js|jsx)$/.test(path) ||
    /(^|\/)[^/]*middleware[^/]*\.(ts|tsx|js|jsx)$/.test(path);

  const isService = (path: string): boolean =>
    /(^|\/)services\/[^/]+\.(ts|tsx|js|jsx)$/.test(path) ||
    /(^|\/)[^/]*service[^/]*\.(ts|tsx|js|jsx)$/.test(path);

  const isChatFile = (path: string): boolean =>
    /(^|\/)[^/]*(chat|conversation|message)[^/]*\.(ts|tsx|js|jsx)$/.test(path);

  const isAuthFile = (path: string): boolean =>
    /(^|\/)[^/]*(auth|login|register|protectedroute)[^/]*\.(ts|tsx|js|jsx)$/.test(path);

  const isFrontendApi = (path: string): boolean =>
    /(^|\/)(api|services)\/.*\.(ts|tsx|js|jsx)$/.test(path) &&
    /(chat|message|conversation)/i.test(path);

  const isDatabaseFile = (path: string): boolean =>
    /(^|\/)(models|schemas|database|db)\/|mongoose|mongo|database|connection/i.test(path);

  // Chatbot request flow.
  if (intent.chat) {
    addMatching(isFrontendApi, 3);
    addMatching(isChatFile, 6);

    // Include the backend entry point to verify router mounting.
    addMatching(isEntryPoint, 3);

    // Include route, controller and service candidates.
    addMatching(
      (path) =>
        isRoute(path) &&
        /(chat|message|conversation)/i.test(path),
      3,
    );

    addMatching(
      (path) =>
        isController(path) &&
        /(chat|message|conversation)/i.test(path),
      3,
    );

    addMatching(
      (path) =>
        isService(path) &&
        /(chat|repo|github|groq)/i.test(path),
      5,
    );
  }

  // Authentication flow.
  if (intent.auth || intent.middleware) {
    addMatching(isEntryPoint, 2);
    addMatching(isAuthFile, 6);
    addMatching(isMiddleware, 4);

    addMatching(
      (path) =>
        isRoute(path) &&
        /(auth|login|register)/i.test(path),
      3,
    );

    addMatching(
      (path) =>
        isController(path) &&
        /(auth|login|register)/i.test(path),
      3,
    );

    addMatching(
      (path) =>
        isService(path) &&
        /(auth|token|user)/i.test(path),
      4,
    );
  }

  // Route mounting and request execution.
  if (intent.route || intent.fullFlow) {
    addMatching(isEntryPoint, 3);
    addMatching(isRoute, 5);
    addMatching(isController, 4);

    if (intent.middleware || intent.auth) {
      addMatching(isMiddleware, 4);
    }

    if (intent.fullFlow) {
      addMatching(isService, 5);
    }
  }

  // Database-related questions.
  if (intent.database) {
    addMatching(isDatabaseFile, 6);
    addMatching(
      (path) =>
        /(^|\/)(config|database|db)\/|mongoose|mongo/i.test(path),
      4,
    );
    addMatching(isController, 2);
    addMatching(isService, 3);
  }

  // Frontend-related questions.
  if (intent.frontend) {
    addMatching(
      (path) =>
        /(^|\/)(pages|components|features|app|shared)\//i.test(path),
      5,
    );
  }

  // Preserve the order in which connected files were discovered.
  return [...connected];
};

// ==================================================
// FILE SCORING
// ==================================================

const scoreFile = (
  path: string,
  keywords: string[],
  question: string,
): number => {
  const lowerPath = path.toLowerCase();
  const fileName = lowerPath.split("/").pop() || "";
  const q = question.toLowerCase();

  let score = 0;

  for (const keyword of keywords) {
    if (keyword.length < 3) {
      continue;
    }

    if (fileName === keyword) {
      score += 15;
    } else if (fileName.includes(keyword)) {
      score += 9;
    } else if (lowerPath.includes(keyword)) {
      score += 4;
    }
  }

  // Prioritize explicitly mentioned file paths.
  const mentionedPaths =
    question.match(
      /[\w.-]+(?:\/[\w.-]+)+|[\w.-]+\.(?:ts|tsx|js|jsx|json|py|java)/gi,
    ) || [];

  for (const mentioned of mentionedPaths) {
    if (lowerPath.includes(mentioned.toLowerCase())) {
      score += 100;
    }
  }

  if (
    q.includes("chat") &&
    /chat|message|conversation/i.test(fileName)
  ) {
    score += 25;
  }

  if (
    (q.includes("route") || q.includes("api") || q.includes("mount")) &&
    /route|router/i.test(lowerPath)
  ) {
    score += 25;
  }

  if (
    q.includes("authentication") ||
    q.includes("auth flow") ||
    q.includes("login")
  ) {
    if (/auth|login|middleware|token/i.test(lowerPath)) {
      score += 20;
    }
  }

  if (
    q.includes("mongodb") ||
    q.includes("database") ||
    q.includes("mongoose")
  ) {
    if (/model|database|db|mongo|connection/i.test(lowerPath)) {
      score += 20;
    }
  }

  if (
    [
      "package.json",
      "app.ts",
      "server.ts",
      "index.ts",
    ].includes(fileName)
  ) {
    score += 3;
  }

  return score;
};

// ==================================================
// RECENT FILE TRACKING
// ==================================================

const selectRelevantFiles = (
  paths: string[],
  question: string,
  recentPaths: string[] = [],
): string[] => {
  const keywords = getRelatedKeywords(question);
  const availablePaths = new Set(paths);

  const validRecentPaths = recentPaths.filter((path) =>
    availablePaths.has(path),
  );

  // First, retrieve connected file candidates.
  const connectedPaths = getConnectedFilePaths(
    paths,
    question,
  );

  const connectedSet = new Set(connectedPaths);
  const recentSet = new Set(validRecentPaths);

  const scoredFiles: ScoredFile[] = paths.map((path) => {
    let score = scoreFile(path, keywords, question);

    // Connected files receive higher priority.
    if (connectedSet.has(path)) {
      score += 60;
    }

    // Previously selected files receive a smaller bonus.
    if (recentSet.has(path)) {
      score += 12;
    }

    return {
      path,
      score,
    };
  });

  const rankedPaths = scoredFiles
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.path.localeCompare(b.path),
    )
    .slice(0, MAX_FILES)
    .map((item) => item.path);

  // Keep connected files at the beginning of the selection.
  const connectedSelected = connectedPaths.filter(
    (path) => rankedPaths.includes(path),
  );

  const remainingSelected = rankedPaths.filter(
    (path) => !connectedSet.has(path),
  );

  return [
    ...connectedSelected,
    ...remainingSelected,
  ].slice(0, MAX_FILES);
};

const updateRecentFiles = (
  cacheKey: string,
  selectedPaths: string[],
): void => {
  const recentCacheKey = `recent:${cacheKey}`;

  const previousPaths =
    getCache<string[]>(recentCacheKey) || [];

  const combinedPaths = [
    ...selectedPaths,
    ...previousPaths,
  ];

  const uniquePaths = [
    ...new Set(combinedPaths),
  ].slice(0, MAX_RECENT_FILES);

  setCache(recentCacheKey, uniquePaths);
};

// ==================================================
// SOURCE FILE FETCHING
// ==================================================

const fetchFileContent = async (
  meta: RepoMeta,
  branch: string,
  path: string,
): Promise<ChatRepoFile | null> => {
  const cacheKey = [
    "file",
    getRepositoryCacheKey(meta),
    branch,
    path,
  ].join(":");

  const cachedFile = getCache<ChatRepoFile>(cacheKey);

  if (cachedFile) {
    console.log(
      `[Chat Repo] Source cache hit: ${path}`,
    );

    return cachedFile;
  }

  try {
    const { data } = await octokit.repos.getContent({
      owner: meta.owner,
      repo: meta.repo,
      path,
      ref: branch,
    });

    if (
      Array.isArray(data) ||
      data.type !== "file" ||
      !("content" in data)
    ) {
      return null;
    }

    const originalContent = Buffer.from(
      data.content,
      "base64",
    ).toString("utf-8");

    const wasFileTruncated =
      originalContent.length > MAX_FILE_SIZE;

    const file: ChatRepoFile = {
      path,
      content: wasFileTruncated
        ? originalContent.slice(0, MAX_FILE_SIZE) +
          "\n[File content truncated due to size limit.]"
        : originalContent,
    };

    setCache(cacheKey, file);

    return file;
  } catch (error) {
    console.warn(
      `[Chat Repo] Could not fetch ${path}:`,
      error instanceof Error
        ? error.message
        : error,
    );

    return null;
  }
};

// ==================================================
// MAIN REPOSITORY CONTEXT FUNCTION
// ==================================================

/**
 * Fetch repository information and prioritize files
 * according to the user's chatbot question.
 *
 * Uses temporary in-memory caching for:
 * 1. Default branch.
 * 2. Repository tree.
 * 3. Individual source files.
 * 4. Recently selected file paths.
 *
 * Connected-file retrieval uses actual paths found
 * in the GitHub repository tree.
 */
export const getChatRepoContext = async (
  repoUrl: string,
  question: string,
): Promise<ChatRepoContext> => {
  const meta = parseRepoUrl(repoUrl);

  const branch = await getDefaultBranch(meta);

  const repositoryKey =
    `${getRepositoryCacheKey(meta)}:${branch}`;

  const tree = await getRepositoryTree(
    meta,
    branch,
  );

  const recentPaths =
    getCache<string[]>(
      `recent:${repositoryKey}`,
    ) || [];

  // Select files using question intent,
  // connected paths, keywords and recent paths.
  const selectedPaths = selectRelevantFiles(
    tree.files,
    question,
    recentPaths,
  );

  updateRecentFiles(
    repositoryKey,
    selectedPaths,
  );

  console.log(
    `[Chat Repo] Question intent:`,
    detectQuestionIntent(question),
  );

  console.log(
    `[Chat Repo] Connected file candidates:`,
    getConnectedFilePaths(tree.files, question),
  );

  console.log(
    `[Chat Repo] Selected files: ${selectedPaths.length}`,
  );

  console.log(
    `[Chat Repo] Selected paths:`,
    selectedPaths,
  );

  const files: ChatRepoFile[] = [];

  let totalChars = 0;
  let sourceTruncated = false;
  let fetchFailed = false;

  // Fetch source files within the total context limit.
  for (const path of selectedPaths) {
    const remaining =
      MAX_TOTAL_CHARS - totalChars;

    if (remaining <= 0) {
      sourceTruncated = true;
      break;
    }

    const file = await fetchFileContent(
      meta,
      branch,
      path,
    );

    if (!file) {
      fetchFailed = true;
      continue;
    }

    // Limit the amount of context consumed by one file.
    const allowedChars = Math.min(
      remaining,
      MAX_PER_FILE_CONTEXT_CHARS,
    );

    const content = file.content.slice(
      0,
      allowedChars,
    );

    if (content.length < file.content.length) {
      sourceTruncated = true;
    }

    if (
      file.content.includes(
        "[File content truncated due to size limit.]",
      )
    ) {
      sourceTruncated = true;
    }

    files.push({
      path: file.path,
      content,
    });

    totalChars += content.length;
  }

  console.log(
    `[Chat Repo] Source files included: ${files.length}`,
  );

  console.log(
    `[Chat Repo] Total source characters: ${totalChars}`,
  );

  console.log(
    `[Chat Repo] Source fetch incomplete: ${
      sourceTruncated || fetchFailed
    }`,
  );

  return {
    owner: meta.owner,
    repo: meta.repo,
    branch,

    totalFiles: tree.files.length,

    allPaths: tree.files.slice(
      0,
      MAX_PATHS_IN_CONTEXT,
    ),

    folderStructure: tree.folders.slice(
      0,
      100,
    ),

    files,

    truncated:
      tree.truncated ||
      tree.files.length > MAX_PATHS_IN_CONTEXT ||
      sourceTruncated ||
      fetchFailed,
  };
};

// ==================================================
// SERVICE EXPORTS
// ==================================================

export const chatRepoService = {
  getChatRepoContext,
};

export default chatRepoService;
