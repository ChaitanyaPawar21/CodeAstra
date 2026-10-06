import path from "path";
import { FileContent } from "./github.service.js";

export type SupportedLanguauge =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "unknown";

export interface ParsedFile {
  filePath: string;
  language: SupportedLanguauge;
  imports: string[];
  exports: string[];
  functions: string[];
  lineCount: number;
}

export interface ParsedRepo {
  files: ParsedFile[];
  sourcePaths: string[];
}

const Lang_Map: Record<string, SupportedLanguauge> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".java": "java",
};

/**Language detection */
const detectLanguage = (filePath: string): SupportedLanguauge => {
  const ext = path.extname(filePath).toLowerCase();
  return Lang_Map[ext] ?? "unknown";
};

/**JS/TS parser */
const parseJSTS = (
  content: string,
): Pick<ParsedFile, "imports" | "exports" | "functions"> => {
  const importsSet = new Set<string>();
  const exportsSet = new Set<string>();
  const functionsSet = new Set<string>();

  // 1. Static imports: import ... from "..." or import "..."
  const staticImport = /import\s+(?:.*?\s+from\s+)?["']([^"']+)["']/g;
  // 2. Require imports: require("...")
  const requireImport = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
  // 3. Dynamic imports & re-exports: import("...") or export * from "..."
  const reExportImport = /export\s+.*?\s+from\s+["']([^"']+)["']/g;

  let m: RegExpExecArray | null;

  while ((m = staticImport.exec(content)) !== null) importsSet.add(m[1]);
  while ((m = requireImport.exec(content)) !== null) importsSet.add(m[1]);
  while ((m = reExportImport.exec(content)) !== null) importsSet.add(m[1]);

  //Exports: export const | function | class | default
  const exportRegex =
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+(\w+)/g;

  while ((m = exportRegex.exec(content)) !== null) exportsSet.add(m[1]);

  // Top-level function
  const fnRegex = /^(?:export\s+)?(?:async\s+)?(?:function|class)\s+(\w+)/gm;
  while ((m = fnRegex.exec(content)) !== null) functionsSet.add(m[1]);

  // Arrow function assignsed to const at top level
  const arrowRegex = /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/gm;
  while ((m = arrowRegex.exec(content)) !== null) functionsSet.add(m[1]);

  return {
    imports: Array.from(importsSet),
    exports: Array.from(exportsSet),
    functions: Array.from(functionsSet),
  };
};

/**python paeser */
const parsePython = (
  content: string,
): Pick<ParsedFile, "imports" | "exports" | "functions"> => {
  const importsSet = new Set<string>();
  const functionsSet = new Set<string>();

  //import x | from x import y
  const importRegex = /^(?:import\s+([\w.]+)|from\s+([\w.]+)\s+import)/gm;

  let m: RegExpExecArray | null;

  while ((m = importRegex.exec(content)) !== null) {
    const imp = m[1] ?? m[2];
    if (imp) importsSet.add(imp);
  }

  // def / class at module level
  const fnRegex = /^(?:def|class)\s+(\w+)/gm;
  while ((m = fnRegex.exec(content)) !== null) functionsSet.add(m[1]);

  // public name -> no underscore as import
  const exports = Array.from(functionsSet).filter((f) => !f.startsWith("_"));

  return {
    imports: Array.from(importsSet),
    exports,
    functions: Array.from(functionsSet),
  };
};

/** java parser */
const parseJava = (
  content: string,
): Pick<ParsedFile, "imports" | "exports" | "functions"> => {
  const importsSet = new Set<string>();
  const exportsSet = new Set<string>();
  const functionsSet = new Set<string>();

  const importRegex = /^import\s+([\w.]+);/gm;
  let m: RegExpExecArray | null;
  while ((m = importRegex.exec(content)) !== null) importsSet.add(m[1]);

  // public class / interface / enum
  const classRegex = /public\s+(?:class|interface|enum)\s+(\w+)/g;
  while ((m = classRegex.exec(content)) !== null) {
    exportsSet.add(m[1]);
    functionsSet.add(m[1]);
  }

  // public methods
  const methodRegex =
    /public\s+(?:static\s+)?(?:final\s+)?[\w<>[\]]+\s+(\w+)\s*\(/g;
  while ((m = methodRegex.exec(content)) !== null) functionsSet.add(m[1]);

  return {
    imports: Array.from(importsSet),
    exports: Array.from(exportsSet),
    functions: Array.from(functionsSet),
  };
};

/** Single file parser */
const parseSingleFile = (filePath: string, content: string): ParsedFile => {
  const language = detectLanguage(filePath);
  const lineCount = content.split("\n").length;

  let parsed: Pick<ParsedFile, "imports" | "exports" | "functions">;

  switch (language) {
    case "javascript":
    case "typescript":
      parsed = parseJSTS(content);
      break;
    case "python":
      parsed = parsePython(content);
      break;
    case "java":
      parsed = parseJava(content);
      break;
    default:
      parsed = { imports: [], exports: [], functions: [] };
  }

  return { filePath, language, lineCount, ...parsed };
};

export const parseRepo = (files: FileContent[]): ParsedRepo => {
  const parsed: ParsedFile[] = [];

  for (const file of files) {
    if (!file.content) continue;
    try {
      parsed.push(parseSingleFile(file.path, file.content));
    } catch (err) {
      console.warn(
        `[Parser service] Skipped '${file.path}':`,
        (err as Error).message,
      );
    }
  }

  return {
    files: parsed,
    sourcePaths: parsed.map((f) => f.filePath),
  };
};

export const parserService = { parseRepo };

export default parserService;
