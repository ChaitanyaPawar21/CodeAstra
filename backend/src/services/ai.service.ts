import { GraphRunResult, runAnalysisGraph } from "../ai/analysis.graph.js";
import { IAnalysisResult } from "../models/repoAnalysis.model.js";
import {
  detectEntryCandidates,
  getFileContent,
  getRepoTree,
  getSourceFiles,
  parseRepoUrl,
  RepoMeta,
  TreeNode,
} from "./github.service.js";
import { ParsedRepo, parseRepo } from "./parser.service.js";

export interface AIServiceResult {
  result: IAnalysisResult | null;
  errors: string[];
  success: boolean;
}

export interface EnrichedParsedRepo extends ParsedRepo {
  entryCandidates?: string[];
  entryContents: Array<{ path: string; content: string }>;
}

/** build m2 context - fetch actual content of entry candidates => token usage low */
const resolveEntryContents = async (
  meta: RepoMeta,
  candidates: string[],
): Promise<Array<{ path: string; content: string }>> => {
  const results: Array<{ path: string; content: string }> = [];

  for (const path of candidates.slice(0, 3)) {
    try {
      const file = await getFileContent(meta, path);
      results.push({ path: file.path, content: file.content });
    } catch {
      console.warn(
        `[AI Service] Could not fetch entry file content for: ${path}`,
      );
    }
  }

  return results;
};

/**Main Orchestrator
 * full pipeline:- repoUrl → GitHub fetch → Parse AST/Regex → M2 Context Fetch → LangGraph → IAnalysisResult
 */
const analyseRepository = async (repoUrl: string): Promise<AIServiceResult> => {
  let meta: RepoMeta;

  try {
    meta = parseRepoUrl(repoUrl);
  } catch (err) {
    return {
      result: null,
      errors: [`[AI Service] Invalid URL: ${(err as Error).message}`],
      success: false,
    };
  }

  let tree: TreeNode[];
  try {
    tree = await getRepoTree(meta);
  } catch (err) {
    return {
      result: null,
      errors: [`[AI Service] Tree fetch failed: ${(err as Error).message}`],
      success: false,
    };
  }

  const rawFiles = await getSourceFiles(meta, tree);

  if (!rawFiles.length) {
    return {
      result: null,
      errors: ["[AI Service] No valid source code files found in repository"],
      success: false,
    };
  }

  const parsedRepo = parseRepo(rawFiles);

  const entryCandidates = detectEntryCandidates(tree);
  const entryContents = await resolveEntryContents(meta, entryCandidates);

  const enrichedRepo: EnrichedParsedRepo = {
    ...parsedRepo,
    entryCandidates,
    entryContents,
  };

  const graphresult = await runAnalysisGraph(enrichedRepo);

  return graphresult;
};

export const aiService = {
   analyseRepository,
}

export default aiService
