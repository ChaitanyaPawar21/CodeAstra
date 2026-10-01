import { Octokit } from "@octokit/rest";
import { config } from "../config/config.js";

/**
 * Interfaces
 */
export interface RepoMeta {
  owner: string;
  repo: string;
}

export interface TreeNode {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

export interface FileContent {
  path: string; // ← was missing
  content: string;
}

const Skip_Dirs = new Set([
  "node_modules",
  "dist",
  "build",
  ".git",
  "coverage",
  ".next",
  "out",
  "__pycache__",
  ".vscode",
  "vendor",
]);

const Entry_Candidates = [
  "server.js",
  "server.ts",
  "index.js",
  "index.ts",
  "main.js",
  "main.ts",
  "app.js",
  "app.ts",
  "main.py",
  "app.py",
  "Main.java",
];

export const octokit = new Octokit({
  auth: config.GITHUB_TOKEN || undefined,
});
/**
 * Extract owner and repo name from a GitHub URL
 */
export const parseRepoUrl = (url: string): RepoMeta => {
  if (!url) {
    throw new Error("Repository Url is required");
  }

  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, "").replace(/\/$/, ""),
  };
};

const shouldSkip = (path: string): boolean => {
  const split = path.split("/").some((seg) => Skip_Dirs.has(seg));
  return split;
};

export const getRepoTree = async (meta: RepoMeta): Promise<TreeNode[]> => {
  try {
    const { data } = await octokit.git.getTree({
      owner: meta.owner,
      repo: meta.repo,
      tree_sha: "HEAD", //default branch
      recursive: "1",
    });

    if (data.truncated) {
      console.warn(
        "[GitHub Service] Tree trucated by GitHub - reposistory is very large.",
      );
    }
    const reponse = (data.tree as TreeNode[]).filter(
      (node) => node.path && !shouldSkip(node.path),
    );

    return reponse;
  } catch (error: any) {
    console.error(
      `[GitHub Service] Error fetching tree for ${meta.owner}/${meta.repo}:`,
      error.message,
    );
    throw new Error(`Failed to fetch repo tree: ${error.message}`);
  }
};

export const filterDirs = (tree: TreeNode[]): TreeNode[] => {
  const Filter = tree.filter((node) => node.type === "tree");
  return Filter;
};

export const detectEntryCandidates = (tree: TreeNode[]): string[] => {
  const files = tree
    .filter((node) => node.type == "blob")
    .map((node) => node.path);

  const rootMatches = files.filter(
    (f) => Entry_Candidates.includes(f.split("/").pop()!) && !f.includes("/"),
  );

  if (rootMatches.length > 0) {
    return rootMatches;
  }

  const fallback = files.filter((f) =>
    Entry_Candidates.includes(f.split("/").pop()!),
  );

  return fallback;
};

export const getFileContent = async (
  meta: RepoMeta,
  path: string,
): Promise<FileContent> => {
  try {
    const { data } = await octokit.repos.getContent({
      owner: meta.owner,
      repo: meta.repo,
      path,
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error(`Path '${path}' is a directory, not a file`);
    }

    return {
      path,
      content: Buffer.from(data.content, "base64").toString("utf-8"),
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch file '${path}': ${error.message}`);
  }
};

export const githubService = {
  parseRepoUrl,
  getRepoTree,
  filterDirs,
  detectEntryCandidates,
  getFileContent,
};

export default githubService;
