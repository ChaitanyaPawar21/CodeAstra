// Shared types for the deterministic repo-graph pipeline.

export const ANALYSIS_VERSION = 2 as const;

export type Layer =
  | "entry"
  | "route"
  | "controller"
  | "service"
  | "repository"
  | "model"
  | "middleware"
  | "config"
  | "util"
  | "types"
  | "ui-page"
  | "ui-component"
  | "state"
  | "api-client"
  | "test"
  | "other";

export type ImportKind = "import" | "require" | "dynamic" | "re-export";

export interface RawImport {
  spec: string; // raw specifier, exactly as written in source
  kind: ImportKind;
  typeOnly: boolean;
  symbols?: string[]; // named bindings, when cheaply available
}

export interface FetchedFile {
  path: string; // repo-relative, forward slashes, root dir stripped
  content: string;
}

export interface FetchResult {
  files: FetchedFile[];
  truncated: boolean;
  truncatedReason: string | null;
}

// Output of the parse stage, per file.
export interface ParsedFile {
  path: string;
  language: string; // extractor id, e.g. "js" | "ts" | "python" | "java" | "other"
  loc: number;
  imports: RawImport[];
  exports: string[];
  annotations: string[]; // framework signals, e.g. "express-router", "spring-rest"
}

// One resolved import target.
export type Resolution =
  | { kind: "internal"; path: string }
  | { kind: "external"; pkg: string }
  | { kind: "unresolved" };

export interface ResolveContext {
  fileSet: Set<string>; // every repo file path
  tsPaths: { baseUrl: string; paths: Record<string, string[]> } | null;
}

// A per-language extractor. Adding a language = adding one of these.
export interface LanguageExtractor {
  id: string;
  extensions: string[]; // including leading dot, lowercase
  extract(content: string): { imports: RawImport[]; exports: string[]; annotations: string[] };
  resolve(spec: string, fromFile: string, ctx: ResolveContext): Resolution[];
}

// Final graph node (stored + returned).
export interface GraphFile {
  path: string;
  language: string;
  loc: number;
  layer: Layer;
  layerReason: string;
  exports: string[];
  externalPackages: string[];
  imports: string[]; // fileIds
  importedBy: string[]; // fileIds, DERIVED by inverting imports
}

export interface GraphEdge {
  source: string; // fileId
  target: string; // fileId
  symbols: string[];
  kind: ImportKind;
  typeOnly: boolean;
}

export interface LayerFlowEntry {
  from: Layer;
  to: Layer;
  count: number;
}

export interface RepoGraphStats {
  files: number;
  parsed: number;
  edges: number;
  unresolved: number;
  truncated: boolean;
  truncatedReason: string | null;
  unsupportedLanguages: string[];
}

export interface RepoGraph {
  version: 2;
  tree: Record<string, unknown>;
  files: Record<string, GraphFile>;
  edges: GraphEdge[];
  cycles: string[][]; // each a list of fileIds
  orphans: string[]; // fileIds
  layerFlow: LayerFlowEntry[];
  stats: RepoGraphStats;
}
