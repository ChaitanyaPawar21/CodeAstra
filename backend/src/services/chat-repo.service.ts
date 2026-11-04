
import { Octokit } from "@octokit/rest";
import { config } from "../config/config.js";
import {
  parseRepoUrl,
  type RepoMeta,
} from "./github.service.js";

export interface ChatRepoFile {
  path: string;
  content: string;
}

export interface ChatRepoContext {
  owner: string;
  repo: string;
  branch: string;
  totalFiles: number;
  folderStructure: string[];
  files: ChatRepoFile[];
  truncated: boolean;
}

const octokit = new Octokit({
  auth: config.GITHUB_TOKEN || undefined,
});

// Directories that should not be fetched.
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
]);

// Source and configuration files useful for chatbot questions.
const ALLOWED_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".py",
  ".java",
  ".html",
  ".css",
  ".scss",
  ".sql",
  ".md",
  ".yml",
  ".yaml",
  ".xml",
  ".env.example",
]);

const MAX_FILES = 150;
const MAX_FILE_SIZE = 40_000;
const MAX_TOTAL_CHARS = 120_000;

const hasAllowedExtension = (path: string): boolean => {
  const fileName = path.split("/").pop() || "";

  if (fileName === ".env.example") {
    return true;
  }

  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex === -1) {
    return false;
  }

  return ALLOWED_EXTENSIONS.has(
    fileName.slice(dotIndex).toLowerCase(),
  );
};

const shouldSkipPath = (path: string): boolean => {
  return path.split("/").some((segment) =>
    SKIP_DIRS.has(segment),
  );
};

const getDefaultBranch = async (
  meta: RepoMeta,
): Promise<string> => {
  const { data } = await octokit.repos.get({
    owner: meta.owner,
    repo: meta.repo,
  });

  return data.default_branch;
};

const getRepositoryTree = async (
  meta: RepoMeta,
  branch: string,
) => {
  const { data: branchData } =
    await octokit.repos.getBranch({
      owner: meta.owner,
      repo: meta.repo,
      branch,
    });

  const commitSha = branchData.commit.sha;

  const { data: treeData } = await octokit.git.getTree({
    owner: meta.owner,
    repo: meta.repo,
    tree_sha: commitSha,
    recursive: "1",
  });

  const files = treeData.tree.filter(
    (node) =>
      node.type === "blob" &&
      node.path &&
      !shouldSkipPath(node.path) &&
      hasAllowedExtension(node.path),
  );

  const folders = new Set<string>();

  for (const node of treeData.tree) {
    if (node.type !== "tree" || !node.path) continue;

    if (!shouldSkipPath(node.path)) {
      folders.add(node.path);
    }
  }

  return {
    files,
    folders: [...folders].sort(),
    truncated: treeData.truncated,
  };
};

const fetchFileContent = async (
  meta: RepoMeta,
  branch: string,
  path: string,
): Promise<ChatRepoFile | null> => {
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

    const content = Buffer.from(
      data.content,
      "base64",
    ).toString("utf-8");

    if (content.length > MAX_FILE_SIZE) {
      return {
        path,
        content:
          content.slice(0, MAX_FILE_SIZE) +
          "\n\n[File truncated because it exceeds the size limit.]",
      };
    }

    return { path, content };
  } catch (error) {
    console.warn(
      `[Chat Repo] Could not fetch ${path}:`,
      error instanceof Error ? error.message : error,
    );

    return null;
  }
};

/**
 * Fetch repository structure and source files specifically
 * for the CodeAstra chatbot.
 */
export const getChatRepoContext = async (
  repoUrl: string,
): Promise<ChatRepoContext> => {
  const meta = parseRepoUrl(repoUrl);

  // Identify the actual default branch.
  const branch = await getDefaultBranch(meta);

  // Fetch file paths and folder structure.
  const tree = await getRepositoryTree(meta, branch);

  const selectedFiles = tree.files.slice(0, MAX_FILES);

  const files: ChatRepoFile[] = [];

  let totalChars = 0;

  // Fetch actual source-code contents.
  for (const node of selectedFiles) {
    if (!node.path) continue;

    const remainingChars = MAX_TOTAL_CHARS - totalChars;

    if (remainingChars <= 0) break;

    const file = await fetchFileContent(
      meta,
      branch,
      node.path,
    );

    if (!file) continue;

    const content = file.content.slice(
      0,
      Math.min(MAX_FILE_SIZE, remainingChars),
    );

    files.push({
      path: file.path,
      content,
    });

    totalChars += content.length;
  }

  return {
    owner: meta.owner,
    repo: meta.repo,
    branch,
    totalFiles: tree.files.length,
    folderStructure: tree.folders,
    files,
    truncated:
      tree.truncated ||
      tree.files.length > MAX_FILES ||
      totalChars >= MAX_TOTAL_CHARS,
  };
};

export const chatRepoService = {
  getChatRepoContext,
};

export default chatRepoService;
