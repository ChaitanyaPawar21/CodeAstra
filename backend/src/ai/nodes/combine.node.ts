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
  const { m1Result, m2Result, m3Result, errors } = state;

  if (!m1Result) errors.push("[Combine] M1 result missing");
  if (!m2Result) errors.push("[Combine] M2 result missing");
  if (!m3Result) errors.push("[Combine] M3 result missing");

  const result: IAnalysisResult = {
    m1: m1Result ?? [],
    m2: m2Result ?? { file: "", executionFlow: [], description: "" },
    m3: {
      graph: m3Result?.graph ?? [],
      formattedAscii: m3Result?.formattedAscii ?? "",
    },
  };

  return {
    combined: {
      result,
      errors,
      success: errors.length === 0,
    },
  };
};
