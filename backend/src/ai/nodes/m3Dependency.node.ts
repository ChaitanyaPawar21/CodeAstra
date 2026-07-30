import { M3Model } from "../model.js";
import { GraphStateType } from "../state.js";
import {
  M3OutputSchema,
  M3_SYSTEM_PROMPT,
  buildM3UserPrompt,
} from "../prompts/m3Prompt.js";

const MAX_FILES_FOR_LLM = 40; // Token limit safeguard

const m3LLM = M3Model.withStructuredOutput(M3OutputSchema);

export const m3DependencyNode = async (
  state: GraphStateType,
): Promise<Partial<GraphStateType>> => {
  try {
    const { files } = state.parsedRepo;

    if (!files.length) {
      return {
        m3Result: { graph: [], formattedAscii: "" },
        errors: ["[M3] No files to map"],
      };
    }

    // Filter local relative imports
    const dependencyData = files.slice(0, MAX_FILES_FOR_LLM).map((f) => ({
      filePath: f.filePath,
      imports: f.imports.filter((i) => i.startsWith(".") || i.startsWith("/")),
    }));

    const result = await m3LLM.invoke([
      { role: "system", content: M3_SYSTEM_PROMPT },
      { role: "user", content: buildM3UserPrompt(dependencyData) },
    ]);

    return {
      m3Result: result,
    };
  } catch (err) {
    return {
      m3Result: { graph: [], formattedAscii: "" },
      errors: [`[M3] ${(err as Error).message}`],
    };
  }
};
