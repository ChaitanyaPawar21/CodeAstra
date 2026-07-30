import { boolean } from "zod";
import { M1Model } from "../model.js";
import {
  buildM1UserPrompt,
  M1_System_Prompt,
  M1OutputSchema,
} from "../prompts/m1Prompt.js";
import { GraphStateType } from "../state.js";

const m1LLM = M1Model.withStructuredOutput(M1OutputSchema);

export const M1FolderNode = async (
  state: GraphStateType,
): Promise<Partial<GraphStateType>> => {
  try {
    const { sourcePaths } = state.parsedRepo;

    const folderPaths = [
      ...new Set(
        sourcePaths
          .map((p) => p.split("/").slice(0, -1).join("/"))
          .filter(boolean),
      ),
    ];

    if (!folderPaths.length) {
      return { m1Result: [], errors: ["[M1] No folders found in parsed repo"] };
    }

    const result = await m1LLM.invoke([
      { role: "system", content: M1_System_Prompt },
      {
        role: "user",
        content: buildM1UserPrompt(folderPaths, sourcePaths),
      },
    ]);

    return {
      m1Result: result.folders,
    };
  } catch (err) {
    return {
      m1Result: [],
      errors: [`[M1] ${(err as Error).message}`],
    };
  }
};
