import { LanguageExtractor } from "../types.js";
import { jstsExtractor } from "./jsts.js";
import { pythonExtractor } from "./python.js";
import { javaExtractor } from "./java.js";

// Registry — add a language by adding one extractor file and listing it here.
export const extractors: LanguageExtractor[] = [jstsExtractor, pythonExtractor, javaExtractor];

const byExt = new Map<string, LanguageExtractor>();
for (const ex of extractors) for (const e of ex.extensions) byExt.set(e, ex);

export const getExtractor = (path: string): LanguageExtractor | null => {
  const dot = path.lastIndexOf(".");
  if (dot === -1) return null;
  return byExt.get(path.slice(dot).toLowerCase()) ?? null;
};
