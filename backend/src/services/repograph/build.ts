import {
  ANALYSIS_VERSION,
  FetchedFile,
  GraphEdge,
  GraphFile,
  Layer,
  RepoGraph,
  ResolveContext,
} from "./types.js";
import { parseFiles, extractTsPaths } from "./parse.js";
import { getExtractor } from "./extractors/index.js";
import { buildTree } from "./tree.js";
import { classifyLayer, findCycles, computeLayerFlow } from "./layers.js";
import { buildAscii } from "./ascii.js";

export { ANALYSIS_VERSION };

interface FetchMeta {
  truncated: boolean;
  truncatedReason: string | null;
}

/** Stages 2–5: pure. Turns fetched files into the deterministic graph. */
export const buildRepoGraph = (files: FetchedFile[], meta: FetchMeta): RepoGraph => {
  const { parsed, unsupportedLanguages } = parseFiles(files);

  // Stable fileIds + path lookup.
  const byPath = new Map<string, string>();
  const idToParsed = new Map<string, (typeof parsed)[number]>();
  parsed.forEach((p, i) => {
    const id = `f${i + 1}`;
    byPath.set(p.path, id);
    idToParsed.set(id, p);
  });

  const ctx: ResolveContext = {
    fileSet: new Set(parsed.map((p) => p.path)),
    tsPaths: extractTsPaths(files),
  };

  // Resolve imports -> edges + per-file internal imports + externals + unresolved count.
  const edgeMap = new Map<string, GraphEdge>(); // key: source>target
  const fileImports = new Map<string, Set<string>>(); // id -> set of target ids
  const fileExternals = new Map<string, Set<string>>();
  let unresolved = 0;

  for (const [id, p] of idToParsed) {
    const ex = getExtractor(p.path);
    const imps = new Set<string>();
    const exts = new Set<string>();
    if (ex) {
      for (const imp of p.imports) {
        let resolutions;
        try {
          resolutions = ex.resolve(imp.spec, p.path, ctx);
        } catch {
          resolutions = [{ kind: "unresolved" as const }];
        }
        for (const r of resolutions) {
          if (r.kind === "external") exts.add(r.pkg);
          else if (r.kind === "unresolved") unresolved++;
          else {
            const target = byPath.get(r.path);
            if (!target || target === id) continue; // skip self / missing
            imps.add(target);
            const key = `${id}>${target}`;
            const existing = edgeMap.get(key);
            if (existing) {
              if (!imp.typeOnly) existing.typeOnly = false;
            } else {
              edgeMap.set(key, { source: id, target, symbols: imp.symbols ?? [], kind: imp.kind, typeOnly: imp.typeOnly });
            }
          }
        }
      }
    }
    fileImports.set(id, imps);
    fileExternals.set(id, exts);
  }

  const edges = Array.from(edgeMap.values());

  // Invert imports -> importedBy (DERIVED, never from an LLM).
  const importedBy = new Map<string, Set<string>>();
  for (const id of idToParsed.keys()) importedBy.set(id, new Set());
  for (const [id, targets] of fileImports) {
    for (const t of targets) importedBy.get(t)!.add(id);
  }

  // Build GraphFiles + layers.
  const graphFiles: Record<string, GraphFile> = {};
  const layerOf = new Map<string, Layer>();
  for (const [id, p] of idToParsed) {
    const imports = Array.from(fileImports.get(id)!);
    const impBy = Array.from(importedBy.get(id)!);
    const { layer, layerReason } = classifyLayer(p.path, p.annotations, imports.length, impBy.length);
    layerOf.set(id, layer);
    graphFiles[id] = {
      path: p.path,
      language: p.language,
      loc: p.loc,
      layer,
      layerReason,
      exports: p.exports,
      externalPackages: Array.from(fileExternals.get(id)!),
      imports,
      importedBy: impBy,
    };
  }

  const ids = Array.from(idToParsed.keys());
  const adj = new Map<string, string[]>();
  for (const id of ids) adj.set(id, graphFiles[id].imports);

  const cycles = findCycles(ids, adj);
  const orphans = ids.filter((id) => graphFiles[id].imports.length === 0 && graphFiles[id].importedBy.length === 0);
  const layerFlow = computeLayerFlow(edges, layerOf);

  return {
    version: 2,
    tree: buildTree(byPath),
    files: graphFiles,
    edges,
    cycles,
    orphans,
    layerFlow,
    stats: {
      files: parsed.length,
      parsed: parsed.filter((p) => p.language !== "other").length,
      edges: edges.length,
      unresolved,
      truncated: meta.truncated,
      truncatedReason: meta.truncatedReason,
      unsupportedLanguages,
    },
  };
};

/** Entry files: layer "entry", else files nothing imports with the most imports. */
const entryRoots = (g: RepoGraph): string[] => {
  const byLayer = Object.entries(g.files).filter(([, f]) => f.layer === "entry").map(([id]) => id);
  if (byLayer.length) return byLayer.slice(0, 3);
  return Object.entries(g.files)
    .filter(([, f]) => f.importedBy.length === 0)
    .sort((a, b) => b[1].imports.length - a[1].imports.length)
    .slice(0, 3)
    .map(([id]) => id);
};

/** Back-compat m3: path-based graph + a real ASCII tree. */
export const legacyM3 = (g: RepoGraph) => {
  const pathOf = (id: string) => g.files[id]?.path ?? id;
  const graph = Object.entries(g.files).map(([, f]) => ({
    file: f.path,
    imports: f.imports.map(pathOf),
    importedBy: f.importedBy.map(pathOf),
  }));
  return { graph, formattedAscii: buildAscii(entryRoots(g), g.files) };
};
