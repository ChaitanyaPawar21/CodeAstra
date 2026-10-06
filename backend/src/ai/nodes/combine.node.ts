import { IAnalysisResult } from "../../models/repoAnalysis.model.js";
import { GraphStateType } from "../state.js";

export interface CombinedOutput {
  result: IAnalysisResult;
  errors: string[];
  success: boolean;
}

export const combineNode = (
  state: GraphStateType,
): Partial<GraphStateType> & { combined: CombinedOutput } => {
  const { m1Result, m2Result, errors } = state;

  if (!m1Result) errors.push("[Combine] M1 result missing");
  if (!m2Result) errors.push("[Combine] M2 result missing");

  // m3 is produced by the repograph pipeline and attached downstream in
  // ai.service; the LLM graph leaves it empty.
  const result: IAnalysisResult = {
    m1: m1Result ?? [],
    m2: m2Result ?? null,
    m3: { graph: [], formattedAscii: "" },
  };

  return {
    combined: {
      result,
      errors,
      success: errors.length === 0,
    },
  };
};
