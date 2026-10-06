import { FetchedFile, ParsedFile } from "./types.js";
import { getExtractor } from "./extractors/index.js";

export interface ParseOutput {
  parsed: ParsedFile[];
  unsupportedLanguages: string[];
}

/** Parse every file. One bad file never fails the run. */
export const parseFiles = (files: FetchedFile[]): ParseOutput => {
  const parsed: ParsedFile[] = [];
  const unsupported = new Set<string>();

  for (const f of files) {
    const loc = f.content ? f.content.split("\n").length : 0;
    const ex = getExtractor(f.path);
    const dot = f.path.lastIndexOf(".");
    const lang = dot === -1 ? "other" : f.path.slice(dot + 1).toLowerCase(); // ts, py, java...

    if (!ex) {
      unsupported.add(dot === -1 ? "(none)" : lang);
      parsed.push({ path: f.path, language: "other", loc, imports: [], exports: [], annotations: [] });
      continue;
    }

    try {
      const r = ex.extract(f.content);
      parsed.push({ path: f.path, language: lang, loc, imports: r.imports, exports: r.exports, annotations: r.annotations });
    } catch (err) {
      console.warn(`[repograph] parse failed for ${f.path}:`, (err as Error).message);
      parsed.push({ path: f.path, language: lang, loc, imports: [], exports: [], annotations: [] });
    }
  }

  return { parsed, unsupportedLanguages: Array.from(unsupported) };
};

// Minimal JSONC cleanup so we can read a tsconfig that has comments / trailing commas.
const stripJsonc = (s: string): string =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");

/** Pull baseUrl + paths from the shallowest tsconfig that defines them. */
export const extractTsPaths = (
  files: FetchedFile[],
): { baseUrl: string; paths: Record<string, string[]> } | null => {
  const configs = files
    .filter((f) => /(^|\/)tsconfig[\w.-]*\.json$/.test(f.path))
    .sort((a, b) => a.path.split("/").length - b.path.split("/").length);

  for (const cfg of configs) {
    try {
      const json = JSON.parse(stripJsonc(cfg.content));
      const co = json.compilerOptions;
      if (!co || !co.paths) continue;
      const dir = cfg.path.includes("/") ? cfg.path.slice(0, cfg.path.lastIndexOf("/")) : "";
      const baseUrl = [dir, co.baseUrl ?? "."].filter(Boolean).join("/");
      return { baseUrl, paths: co.paths };
    } catch {
      // ignore malformed tsconfig
    }
  }
  return null;
};
