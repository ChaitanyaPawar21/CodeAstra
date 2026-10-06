import { z } from "zod";

/** Zod schema - matches IEntryPoint */
export const M2Outputschema = z.object({
  file: z.string().describe("The entry point file e.g. server.ts"),
  executionFlow: z
    .array(z.string())
    .describe(
      "Ordered steps of what happens when the entry file runs. Each step is one plain-English sentence.",
    ),
  description: z
    .string()
    .describe("2-3 sentence summary of how the application bootstraps"),
});

export type M2Outputschema = z.infer<typeof M2Outputschema>;

export const M2_System_Prompt = `You are an expert software engineer performing codebase onboarding analysis.

Your task is to identify the application entry point and describe the initial execution flow.

RULES:
- Identify the single most likely entry point (server.ts, main.py, index.js, app.ts etc.)
- Describe execution flow as ordered steps — what the program does first, second, third
- Each step must be one plain-English sentence starting with an action verb
- Focus on setup sequence: env loading, DB connection, middleware, routes, server start
- If multiple candidates exist, pick the one that bootstraps the entire application

EXECUTION FLOW FORMAT:
Each array item should follow this pattern:
"<file> <action verb> <what it does>"
Example: "server.ts loads environment variables from .env"`;

/**  User prompt builder */
export const buildM2UserPrompt = (
  entryCandidates: string[],
  entryFileContents: Array<{ path: string; content: string }>,
): string => `
Detect the application entry point from these candidates:

ENTRY CANDIDATES:
${entryCandidates.map((f) => `- ${f}`).join("\n")}

ENTRY FILE CONTENTS:
${entryFileContents
  .map(
    (f) => `
--- ${f.path} ---
${f.content.slice(0, 800)}
`,
  )
  .join("\n")}

Identify the true entry point and describe its execution flow step by step.
`;
