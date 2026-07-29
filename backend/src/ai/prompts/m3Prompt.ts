import { z } from "zod";

/** Zod schema — matches IDependencyMap */
export const M3OutputSchema = z.object({
  graph: z.array(
    z.object({
      file: z.string().describe("File path relative to repo root"),
      imports: z
        .array(z.string())
        .describe("Files or modules this file imports"),
      importedBy: z
        .array(z.string())
        .describe("Files that import this file"),
    }),
  ),
  formattedAscii: z
    .string()
    .describe(
      "ASCII tree showing the most important dependency chain. e.g. auth.routes.ts → auth.controller.ts → user.service.ts → user.model.ts",
    ),
});

export type M3Output = z.infer<typeof M3OutputSchema>;

export const M3_SYSTEM_PROMPT = `You are an expert software architect performing dependency analysis on a codebase.

Your task is to map how files import each other and identify the critical dependency chains.

RULES:
- Only include internal project files — ignore node_modules, external packages
- Resolve relative import paths to actual file paths where possible  
- importedBy is the reverse of imports — if A imports B, then B.importedBy includes A
- formattedAscii must show the most important chain (e.g. routes → controller → service → model)
- Keep formattedAscii focused on the dominant architectural pattern

ASCII FORMAT EXAMPLE:
auth.routes.ts
└── auth.controller.ts
    └── user.service.ts
        └── user.model.ts`;

/** User prompt builder */
export const buildM3UserPrompt = (
  dependencyData: Array<{
    filePath: string;
    imports: string[];
  }>,
): string => `
Analyze these file import relationships and build a dependency map:

FILE IMPORTS:
${dependencyData
  .map(
    (f) =>
      `${f.filePath}:\n${
        f.imports.length
          ? f.imports.map((i) => `  → ${i}`).join("\n")
          : "  → (no imports)"
      }`,
  )
  .join("\n\n")}

Build the complete dependency graph and identify the critical dependency chain.
`;
