import { z } from "zod";

/** Zod schema — matches IDependencyMap */
export const M3OutputSchema = z.object({
  graph: z.array(
    z.object({
      file: z.string().min(1).describe("File path — REQUIRED, never omit"),
      imports: z.array(z.string()),
      importedBy: z.array(z.string()),
    }),
  ),
  formattedAscii: z.string(),
});

export type M3Output = z.infer<typeof M3OutputSchema>;

export const M3_SYSTEM_PROMPT = `You are an expert software architect performing dependency analysis on a codebase.

Your task is to map how files import each other and identify the critical dependency chains.

RULES:
- Every node in the graph array MUST include the "file" field — this is required, never omit it
- Only include internal project files — ignore node_modules, external packages
- Resolve relative import paths to actual file paths where possible
- importedBy is the reverse of imports — if A imports B, then B.importedBy includes A
- formattedAscii must show the most important chain
- If no dependencies found, still return each file with its path in the "file" field

ASCII FORMAT EXAMPLE:
index.js
└── lib/express.js
    └── lib/application.js`;

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
