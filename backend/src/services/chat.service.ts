
// backend/src/services/chat.service.ts
// CodeAstra Repository Assistant - Groq integration

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatInput {
  message: string;
  history: ChatMessage[];
  repoUrl?: string;
  repoName?: string;
  analysis?: unknown;
}

const BASE_URL =
  process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";

const MODEL =
  process.env.AI_MODEL || "openai/gpt-oss-120b";

// Safely convert unknown values into objects
function asObject(value: unknown): Record<string, any> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }

  return {};
}

// Extract useful repository information from AnalysisContext data
function buildRepositoryContext(analysis: unknown): string {
  const data = asObject(analysis);

  if (!Object.keys(data).length) {
    return "No repository analysis data was provided.";
  }

  const sections: string[] = [];

  // 1. Repository overview
  const summary = asObject(data.summary);
  const overview = asObject(data.repositoryOverview);

  sections.push(`
REPOSITORY OVERVIEW
Name: ${summary.title || overview.name || "Unknown"}
Description: ${summary.description || overview.description || "Not available"}
Technologies: ${(overview.technologies || summary.techStack?.map((t: any) => t.name) || []).join(", ")}
Total files: ${summary.totalFiles ?? "Unknown"}
`);

  // 2. Folder hierarchy
  const folders = Array.isArray(data.folderHierarchy)
    ? data.folderHierarchy
    : [];

  sections.push(`
FOLDER STRUCTURE
${folders.length
    ? folders.map((folder: any) =>
        `- ${folder.name}: ${folder.explanation || "No description"} (${folder.filesCount ?? "?"} files)`
      ).join("\n")
    : "Folder information unavailable."}
`);

  // 3. Entry points
  const entryPoints = Array.isArray(data.entryPoints)
    ? data.entryPoints
    : [];

  sections.push(`
ENTRY POINTS
${entryPoints.length
    ? entryPoints.map((entry: any) =>
        `- ${entry.label || entry.file || "Unknown"}`
      ).join("\n")
    : "Entry-point information unavailable."}
`);

  // 4. Dependency graph - most important for locating files
  const dependencyGraph = asObject(data.dependencyGraph);
  const nodes = Array.isArray(dependencyGraph.nodes)
    ? dependencyGraph.nodes
    : [];

  const edges = Array.isArray(dependencyGraph.edges)
    ? dependencyGraph.edges
    : [];

  sections.push(`
REPOSITORY FILES AND DEPENDENCIES
Total graph nodes: ${nodes.length}

${nodes.length
    ? nodes.map((node: any) => {
        const path = node.label || node.id || "Unknown file";
        const imports = Array.isArray(node.imports)
          ? node.imports.join(", ")
          : "";
        const importedBy = Array.isArray(node.importedBy)
          ? node.importedBy.join(", ")
          : "";

        return [
          `File: ${path}`,
          `Layer: ${node.type || "Unknown"}`,
          `Language: ${node.language || "Unknown"}`,
          `Imports: ${imports || "None recorded"}`,
          `Imported by: ${importedBy || "None recorded"}`,
        ].join("\n");
      }).join("\n\n")
    : "Dependency graph file information unavailable."}
`);

  // 5. Critical files
  const criticalFiles = Array.isArray(data.criticalFiles)
    ? data.criticalFiles
    : [];

  sections.push(`
IMPORTANT FILES
${criticalFiles.length
    ? criticalFiles.map((file: any) =>
        `- ${file.name}: ${file.importance || "Important module"}`
      ).join("\n")
    : "No critical-file information available."}
`);

  // 6. AI insights
  const insights = Array.isArray(data.aiInsights)
    ? data.aiInsights
    : [];

  sections.push(`
ARCHITECTURE INSIGHTS
${insights.length
    ? insights.map((item: any) =>
        `- ${item.title}: ${item.description}`
      ).join("\n")
    : "No additional architecture insights available."}
`);

  // 7. Dependency statistics
  const stats = asObject(dependencyGraph.stats);

  sections.push(`
DEPENDENCY STATISTICS
Files: ${stats.files ?? nodes.length}
Parsed: ${stats.parsed ?? "Unknown"}
Edges: ${stats.edges ?? edges.length}
Unresolved imports: ${stats.unresolved ?? "Unknown"}
`);

  // Keep useful sections while avoiding unlimited prompt size.
  // File paths and dependency relationships are prioritized.
  const MAX_CONTEXT_CHARS = 8000;

  return sections.join("\n").slice(0, MAX_CONTEXT_CHARS);
}

// Build system prompt
function buildSystemPrompt(input: ChatInput): string {
  const repositoryContext = buildRepositoryContext(input.analysis);

  return `
You are CodeAstra's Repository Assistant.

You help developers understand the actual GitHub repository:
its architecture, folder structure, source files, dependencies,
API routes, authentication, database connections and execution flow.

REPOSITORY:
${input.repoName || input.repoUrl || "Unknown repository"}

REPOSITORY URL:
${input.repoUrl || "Not provided"}

REPOSITORY ANALYSIS:
${repositoryContext}

IMPORTANT INSTRUCTIONS:

1. Answer repository-specific questions using the repository analysis above.

2. When asked where a file is located, search the REPOSITORY FILES
   AND DEPENDENCIES section for matching file paths.

3. When asked about API routes, look for files inside folders
   named routes, route, api or similar.

4. When asked about authentication, look for auth-related
   routes, controllers, services and middleware.

5. When asked about MongoDB, search for database configuration,
   models, connection services and related dependencies.

6. When explaining execution flow, use entry points,
   imports and importedBy relationships.

7. Always mention actual file paths when available.

8. Never invent file names, paths, functions or code that
   are not present in the provided repository analysis.

9. The analysis contains file paths and dependency information,
   not necessarily complete source-code contents.
   Do not claim to have read a file's implementation
   unless its source code is actually provided.

10. If the requested information is missing, clearly explain
    what information is unavailable instead of guessing.

11. Give practical answers with headings, bullet points
    and code examples when appropriate.

12. Explain technical concepts in simple language.
`;
}

// Main Groq chatbot function
export async function askRepoAssistant(
  input: ChatInput
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in backend/.env");
  }

  const history = input.history
  .slice(-4)
  .map((msg) => ({
    role: msg.role,
    content: msg.content.slice(0, 1000),
  }));

  const systemPrompt = buildSystemPrompt(input);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },

    body: JSON.stringify({
      model: MODEL,

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...history,
        {
          role: "user",
          content: input.message,
        },
      ],

      temperature: 0.3,
      max_tokens: 512,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();

    throw new Error(
      `Groq API ${response.status}: ${detail.slice(0, 500)}`
    );
  }

  const result: any = await response.json();

  const reply = result.choices?.[0]?.message?.content?.trim();

  return reply || "I couldn't generate a response. Please try again.";
}
