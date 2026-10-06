import { END, START, StateGraph } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { M1FolderNode } from "./nodes/m1Folder.node.js";
import { m2EntryPointNode } from "./nodes/m2EntryPoint.node.js";
import { CombinedOutput, combineNode } from "./nodes/combine.node.js";
import { ParsedRepo } from "../services/parser.service.js";
import { IAnalysisResult } from "../models/repoAnalysis.model.js";

// m3 (dependency graph) is now produced deterministically by the repograph
// pipeline, not the LLM. This graph only runs the m1/m2 reasoning passes.
const workFlow = new StateGraph(GraphState)
  /** parallel nodes */
  .addNode("m1", M1FolderNode)
  .addNode("m2", m2EntryPointNode)
  .addNode("combine", combineNode)

  /**Start  */
  .addEdge(START, "m1")
  .addEdge(START, "m2")

  /** both must complete before combine runs */
  .addEdge("m1", "combine")
  .addEdge("m2", "combine")

  .addEdge("combine", END);

/** Compiled graph */
export const analysisGraph = workFlow.compile();

export interface GraphRunResult {
  result: IAnalysisResult | null;
  errors: string[];
  success: boolean;
}

export const runAnalysisGraph = async (
  parsedRepo: ParsedRepo,
  entryCandidates: string[],
  entryContents: Array<{ path: string; content: string }>,
): Promise<GraphRunResult> => {
  try {
    const finalState = await analysisGraph.invoke({
      parsedRepo,
      entryCandidates,
      entryContents,
      m1Result: null,
      m2Result: null,
      errors: [],
      combined: null,
    });

    const combined = (finalState as any).combined as CombinedOutput;

    if (!combined) {
      return {
        result: null,
        errors: ["[Graph] combine node did not produce output"],
        success: false,
      };
    }

    return {
      result: combined.result,
      errors: combined.errors,
      success: combined.success,
    };
  } catch (err) {
    return {
      result: null,
      errors: [`[Graph] Fatal: ${(err as Error).message}`],
      success: false,
    };
  }
};
