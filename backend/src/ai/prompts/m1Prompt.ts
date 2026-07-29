import { z } from "zod";

/** Zod schema - matches IfolderEntry[] */
export const M1OutputSchema = z.object({
  folders: z.array(
    z.object({
      path: z.string().describe("Folder path relative to repo root"),
      purpose: z
        .string()
        .describe("Plain-English explaination of What this folder contains"),
      type: z
        .enum(["entry", "logic", "config", "utility", "test", "other"])
        .describe("Category of this folder's role in the object"),
    }),
  ),
});

export type M1Output = z.infer<typeof M1OutputSchema>;

export const M1_System_Prompt = `You are an expert sofware architect analyzing a code repository.

Your task is to analyze the folder structure and explain the purpose of each directory in plain English

Rules:
- Only include directories,not individual files
- Explain each folder's role ad if explaining to developer joining the project today
- Be concise - one clear sentence per folder
- Assign the most accurate type from: entry, logic, config, uitility, test, other
- Ignore noise folders like node_modules, dist, build, .git

- entry     → application startup or main entry folders (src/, app/)
- logic     → core business logic (controllers/, services/, handlers/)
- config    → configuration and environment setup (config/, env/)
- utility   → shared helpers and utilities (utils/, helpers/, lib/)
- test      → test files and fixtures (tests/, __tests__/, spec/)
- other     → anything that doesn't fit above categories
`;

/**User prompt builder */
export const buildM1UserPrompt = (
    folderPaths: string[],
    sampleFilePaths: string[],
): string => `
Analyze this repository folder structure:

DIRECTORIES:
${folderPaths.map((p) => `- ${p}`).join("\n")}

SAMPLE FILES (for context):
${sampleFilePaths.slice(0, 30).map((p) => `- ${p}`).join("\n")}

Return a structured explanation of each directory's purpose.
`