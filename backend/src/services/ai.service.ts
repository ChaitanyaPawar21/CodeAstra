import { runAnalysisGraph } from "../ai/analysis.graph.js";
import { IAnalysisResult, IDependencyMap } from "../models/repoAnalysis.model.js";
import {
  detectEntryCandidates,
  getFileContent,
  getRepoTree,
  parseRepoUrl,
  RepoMeta,
  TreeNode,
} from "./github.service.js";
import { parseRepo } from "./parser.service.js";
import { fetchRepoFiles } from "./repograph/fetch.js";
import { buildRepoGraph, legacyM3 } from "./repograph/index.js";

export interface AIServiceResult {
  result: IAnalysisResult | null;
  errors: string[];
  success: boolean;
}

// Source files we feed to the LLM (m1/m2 context) — token-capped subset.
const LLM_SOURCE_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".py", ".java"]);
const MAX_LLM_FILES = 60;

const extname = (p: string) => {
  const i = p.lastIndexOf(".");
  return i === -1 ? "" : p.slice(i).toLowerCase();
};

/**
 * Orchestrator: fetch the repo once (tarball), build the deterministic
 * dependency graph, and run the LangGraph LLM pass (m1/m2) in parallel.
 * The graph (m3) is always real; m1/m2 are marked unavailable if the LLM fails.
 */
const analyseRepository = async (repoUrl: string): Promise<AIServiceResult> => {
  let meta: RepoMeta;
  try {
    meta = parseRepoUrl(repoUrl);
  } catch (err) {
    return { result: null, errors: [`[AI Service] Invalid URL: ${(err as Error).message}`], success: false };
  }

  // Tree (for entry detection) + full file fetch (one tarball) in parallel.
  let tree: TreeNode[] = [];
  let fetched;
  try {
    [tree, fetched] = await Promise.all([
      getRepoTree(meta).catch(() => [] as TreeNode[]),
      fetchRepoFiles(meta),
    ]);
  } catch (err) {
    return { result: null, errors: [`[AI Service] Repo fetch failed: ${(err as Error).message}`], success: false };
  }

  if (!fetched.files.length) {
    return { result: null, errors: ["[AI Service] No source files found in repository"], success: false };
  }

  // Deterministic graph — the real deliverable.
  const repoGraph = buildRepoGraph(fetched.files, {
    truncated: fetched.truncated,
    truncatedReason: fetched.truncatedReason,
  });
  const { graph, formattedAscii } = legacyM3(repoGraph);
  const m3: IDependencyMap = {
    graph,
    formattedAscii,
    version: repoGraph.version,
    tree: repoGraph.tree,
    files: repoGraph.files,
    edges: repoGraph.edges,
    cycles: repoGraph.cycles,
    orphans: repoGraph.orphans,
    layerFlow: repoGraph.layerFlow,
    stats: repoGraph.stats,
  };

  // LLM context from the already-fetched files (no extra network).
  const contentByPath = new Map(fetched.files.map((f) => [f.path, f.content]));
  const parsedRepo = parseRepo(
    fetched.files.filter((f) => LLM_SOURCE_EXT.has(extname(f.path))).slice(0, MAX_LLM_FILES),
  );
  const entryCandidates = detectEntryCandidates(tree);
  const entryContents = await resolveEntryContents(meta, entryCandidates, contentByPath);

  // LLM pass (m1/m2). Failure is non-fatal — the graph still ships.
  const warnings: string[] = [];
  let m1: IAnalysisResult["m1"] = [];
  let m2: IAnalysisResult["m2"] = null;
  try {
    const graphResult = await runAnalysisGraph(parsedRepo, entryCandidates, entryContents);
    if (graphResult.success && graphResult.result) {
      m1 = graphResult.result.m1 ?? [];
      m2 = graphResult.result.m2 ?? null;
      if (graphResult.errors.length) warnings.push(...graphResult.errors);
    } else {
      warnings.push("[AI Service] LLM pass unavailable — m1/m2 omitted", ...graphResult.errors);
    }
  } catch (err) {
    warnings.push(`[AI Service] LLM pass failed — m1/m2 omitted: ${(err as Error).message}`);
  }

  return { result: { m1, m2, m3 }, errors: warnings, success: true };
};

/** Prefer already-fetched content; fall back to a direct fetch only if missing. */
const resolveEntryContents = async (
  meta: RepoMeta,
  candidates: string[],
  contentByPath: Map<string, string>,
): Promise<Array<{ path: string; content: string }>> => {
  const out: Array<{ path: string; content: string }> = [];
  for (const path of candidates.slice(0, 3)) {
    const cached = contentByPath.get(path);
    if (cached !== undefined) {
      out.push({ path, content: cached });
      continue;
    }
    try {
      const file = await getFileContent(meta, path);
      out.push({ path: file.path, content: file.content });
    } catch {
      console.warn(`[AI Service] Could not fetch entry file content for: ${path}`);
    }
  }
  return out;
};

export const aiService = { analyseRepository };
export default aiService;
