import { Layer, LayerFlowEntry } from "./types.js";

// Framework annotation -> layer.
const ANNOTATION_LAYER: Record<string, { layer: Layer; reason: string }> = {
  "express-router": { layer: "route", reason: "Express router calls" },
  "nest-controller": { layer: "controller", reason: "@Controller decorator" },
  "nest-service": { layer: "service", reason: "@Injectable decorator" },
  "nest-module": { layer: "config", reason: "@Module decorator" },
  "spring-rest": { layer: "controller", reason: "@RestController/@Controller" },
  "spring-service": { layer: "service", reason: "@Service" },
  "spring-repository": { layer: "repository", reason: "@Repository" },
  "spring-entity": { layer: "model", reason: "@Entity" },
  "django-urls": { layer: "route", reason: "Django urlpatterns" },
  "django-model": { layer: "model", reason: "Django models.Model" },
};

// Ordered path/filename rules — first match wins.
const PATH_RULES: Array<{ test: (segs: string[], fname: string) => boolean; layer: Layer; reason: string }> = [
  { test: (s, f) => s.includes("test") || s.includes("tests") || s.includes("__tests__") || /\.(test|spec)\./.test(f), layer: "test", reason: "test path/filename" },
  { test: (s, f) => s.includes("routes") || /\.route\./.test(f), layer: "route", reason: "routes/*.route convention" },
  { test: (s, f) => s.includes("controllers") || /\.controller\./.test(f), layer: "controller", reason: "controllers/*.controller convention" },
  { test: (s, f) => s.includes("services") || /\.service\./.test(f), layer: "service", reason: "services/*.service convention" },
  { test: (s) => s.includes("dao") || s.includes("repositories") || s.includes("repository"), layer: "repository", reason: "dao/repositories convention" },
  { test: (s, f) => s.includes("models") || s.includes("entities") || /\.(model|entity)\./.test(f), layer: "model", reason: "models/entities convention" },
  { test: (s, f) => s.includes("middleware") || s.includes("middlewares") || /\.middleware\./.test(f), layer: "middleware", reason: "middleware convention" },
  { test: (s, f) => /\.api\./.test(f) || s.includes("api-client"), layer: "api-client", reason: "*.api convention" },
  { test: (s, f) => s.includes("store") || s.includes("stores") || s.includes("context") || s.includes("hooks") || s.includes("reducers") || /\.(store|slice|context)\./.test(f), layer: "state", reason: "store/context/hooks convention" },
  { test: (s, f) => s.includes("pages") || /page\.(t|j)sx?$/.test(f), layer: "ui-page", reason: "pages/*Page convention" },
  { test: (s) => s.includes("components"), layer: "ui-component", reason: "components convention" },
  { test: (s, f) => s.includes("config") || /(^|\.)config\./.test(f), layer: "config", reason: "config convention" },
  { test: (s, f) => s.includes("utils") || s.includes("util") || s.includes("helpers") || s.includes("lib") || /\.util\./.test(f), layer: "util", reason: "utils/helpers convention" },
  { test: (s, f) => s.includes("types") || s.includes("@types") || /\.types\./.test(f), layer: "types", reason: "types convention" },
];

export const classifyLayer = (
  path: string,
  annotations: string[],
  internalImportCount: number,
  importedByCount: number,
): { layer: Layer; layerReason: string } => {
  for (const a of annotations) {
    if (ANNOTATION_LAYER[a]) return { layer: ANNOTATION_LAYER[a].layer, layerReason: ANNOTATION_LAYER[a].reason };
  }

  const lower = path.toLowerCase();
  const segs = lower.split("/");
  const fname = segs[segs.length - 1];
  for (const rule of PATH_RULES) {
    if (rule.test(segs, fname)) return { layer: rule.layer, layerReason: rule.reason };
  }

  // graph-shape heuristics
  if (importedByCount === 0 && internalImportCount >= 3) {
    return { layer: "entry", layerReason: "no importers, imports many modules" };
  }
  if (internalImportCount === 0 && importedByCount >= 3) {
    return { layer: "util", layerReason: "leaf imported by many modules" };
  }

  return { layer: "other", layerReason: "no matching rule" };
};

/** Tarjan SCC — returns strongly-connected components of size > 1 (import cycles). */
export const findCycles = (ids: string[], adj: Map<string, string[]>): string[][] => {
  let index = 0;
  const idx = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  const strong = (v: string) => {
    idx.set(v, index);
    low.set(v, index);
    index++;
    stack.push(v);
    onStack.add(v);

    for (const w of adj.get(v) ?? []) {
      if (!idx.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v)!, idx.get(w)!));
      }
    }

    if (low.get(v) === idx.get(v)) {
      const comp: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1) sccs.push(comp);
    }
  };

  // ponytail: recursive Tarjan; iterative version only needed if a repo blows the call stack.
  for (const v of ids) if (!idx.has(v)) strong(v);
  return sccs;
};

export const computeLayerFlow = (
  edges: Array<{ source: string; target: string }>,
  layerOf: Map<string, Layer>,
): LayerFlowEntry[] => {
  const counts = new Map<string, number>();
  for (const e of edges) {
    const from = layerOf.get(e.source);
    const to = layerOf.get(e.target);
    if (!from || !to) continue;
    const key = `${from}>${to}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([key, count]) => {
    const [from, to] = key.split(">") as [Layer, Layer];
    return { from, to, count };
  });
};
