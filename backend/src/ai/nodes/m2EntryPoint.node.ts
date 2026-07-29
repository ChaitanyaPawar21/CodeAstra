import { EnrichedParsedRepo } from "../../services/ai.service.js";
import { geminiModel } from "../model.js";
import {
  buildM2UserPrompt,
  M2_System_Prompt,
  M2Outputschema,
} from "../prompts/m2Prompt.js";
import { GraphStateType } from "../state.js";

const ENTRY_CANDIDATES = [
  "server.ts",
  "server.js",
  "index.ts",
  "index.js",
  "main.ts",
  "main.js",
  "app.ts",
  "app.js",
  "main.py",
  "app.py",
  "Main.java",
];

const m2LLM = geminiModel.withStructuredOutput(M2Outputschema);

export const m2EntryPointNode = async (
  state: GraphStateType,
): Promise<Partial<GraphStateType>> => {
  try {
    const { files, sourcePaths } = state.parsedRepo;
    const enrichedRepo = state.parsedRepo as EnrichedParsedRepo;

    const candidates = enrichedRepo.entryCandidates?.length
      ? enrichedRepo.entryCandidates
      : sourcePaths.filter((p) =>
          ENTRY_CANDIDATES.includes(p.split("/").pop()!),
        );

    if (!candidates.length) {
      return {
        m2Result: {
          file: "unknown",
          executionFlow: [],
          description: "No entry detected.",
        },
        errors: ["\n[m2] No entry candidates found"],
      };
    }
    const entryContents = enrichedRepo.entryContents?.length
      ? enrichedRepo.entryContents
      : (candidates
          .map((path) => {
            const parsed = files.find((f) => f.filePath === path);
            return parsed
              ? { path, content: parsed.functions.join(", ") }
              : null;
          })
          .filter(Boolean) as Array<{ path: string; content: string }>);

    const result = await m2LLM.invoke([
      {
        role: "system",
        content: M2_System_Prompt,
      },
      {
        role: "user",
        content: buildM2UserPrompt(candidates, entryContents),
      },
    ]);

    return {
      m2Result: result,
    };
  } catch (err) {
    return {
      m2Result: { file: "unknown", executionFlow: [], description: "" },
      errors: [`[M2] ${(err as Error).message}`],
    };
  }
};
