import { Readable } from "node:stream";
import { Parser } from "tar";
import { octokit, RepoMeta } from "../github.service.js";
import { FetchResult, FetchedFile } from "./types.js";

const MAX_FILES = 3000;
const MAX_FILE_BYTES = 300 * 1024; // 300 KB per file
const MAX_TOTAL_BYTES = 80 * 1024 * 1024; // 80 MB of kept content

const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", ".git", "coverage", ".next", "out",
  "__pycache__", ".vscode", ".idea", "vendor", "target", "bin", "obj",
  ".venv", "venv", "env", ".cache", ".turbo", "tmp", "temp",
]);

// Files we never want as graph nodes.
const SKIP_FILES = new Set([
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml", "npm-shrinkwrap.json",
  "poetry.lock", "pipfile.lock", "gemfile.lock", "go.sum", "cargo.lock",
  "composer.lock",
]);

// Binary / non-source extensions — skip outright.
const BINARY_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "svg", "bmp", "tiff",
  "pdf", "zip", "gz", "tar", "rar", "7z", "bz2", "xz",
  "mp3", "mp4", "mov", "avi", "wav", "flac", "ogg", "webm",
  "woff", "woff2", "ttf", "eot", "otf",
  "exe", "dll", "so", "dylib", "bin", "class", "o", "a", "jar",
  "wasm", "pyc", "pyo", "lock", "map", "snap", "min",
]);

// Known source extensions — used to prioritise when truncating.
const SOURCE_EXT = new Set([
  "js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "java", "go", "rb", "rs",
  "php", "c", "cc", "cpp", "h", "hpp", "cs", "kt", "swift", "scala",
]);

const ext = (p: string) => p.split(".").pop()!.toLowerCase();
const base = (p: string) => p.split("/").pop()!.toLowerCase();

const shouldKeep = (path: string): boolean => {
  const segs = path.split("/");
  if (segs.some((s) => SKIP_DIRS.has(s))) return false;
  if (SKIP_FILES.has(base(path))) return false;
  const e = ext(path);
  if (BINARY_EXT.has(e)) return false;
  if (/\.min\.(js|css)$/.test(path)) return false;
  if (/\.d\.ts$/.test(path)) return false; // generated type decls
  return true;
};

// Strip the tarball's single root directory: "owner-repo-sha/src/a.ts" -> "src/a.ts"
const stripRoot = (p: string): string => {
  const i = p.indexOf("/");
  return i === -1 ? p : p.slice(i + 1);
};

/** Download the default-branch tarball once and extract text files in memory. */
export const fetchRepoFiles = async (meta: RepoMeta): Promise<FetchResult> => {
  const { data: repo } = await octokit.repos.get({ owner: meta.owner, repo: meta.repo });
  const ref = repo.default_branch;

  const res = await octokit.repos.downloadTarballArchive({
    owner: meta.owner,
    repo: meta.repo,
    ref,
  });
  const buf = Buffer.from(res.data as ArrayBuffer);

  const collected: FetchedFile[] = [];
  let totalBytes = 0;
  let overflow = false; // hit a byte/count cap while reading

  await new Promise<void>((resolve, reject) => {
    const parser = new Parser(); // auto-detects gzip
    parser.on("entry", (entry: any) => {
      const rel = stripRoot(String(entry.path).replace(/\\/g, "/"));
      if (entry.type !== "File" || !rel || !shouldKeep(rel)) {
        entry.resume();
        return;
      }
      if (totalBytes >= MAX_TOTAL_BYTES) {
        overflow = true;
        entry.resume();
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      let tooBig = false;
      let binary = false;
      entry.on("data", (c: Buffer) => {
        if (tooBig) return;
        if (size === 0 && c.includes(0)) binary = true; // null byte => binary
        size += c.length;
        if (size > MAX_FILE_BYTES) {
          tooBig = true;
          return;
        }
        chunks.push(c);
      });
      entry.on("end", () => {
        if (tooBig || binary) return;
        totalBytes += size;
        collected.push({ path: rel, content: Buffer.concat(chunks).toString("utf-8") });
      });
    });
    parser.on("end", resolve);
    parser.on("error", reject);
    Readable.from(buf).pipe(parser as any);
  });

  // Prioritise source files + shallower paths when over the file cap.
  let files = collected;
  let truncated = overflow;
  let truncatedReason: string | null = overflow
    ? `content exceeded ${Math.round(MAX_TOTAL_BYTES / 1024 / 1024)}MB cap`
    : null;

  if (files.length > MAX_FILES) {
    files = [...collected].sort((a, b) => {
      const as = SOURCE_EXT.has(ext(a.path)) ? 0 : 1;
      const bs = SOURCE_EXT.has(ext(b.path)) ? 0 : 1;
      if (as !== bs) return as - bs;
      return a.path.split("/").length - b.path.split("/").length;
    }).slice(0, MAX_FILES);
    truncated = true;
    truncatedReason = `kept ${MAX_FILES} of ${collected.length} files (source-first)`;
  }

  return { files, truncated, truncatedReason };
};
