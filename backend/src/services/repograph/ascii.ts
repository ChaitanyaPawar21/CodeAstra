import { GraphFile } from "./types.js";

/** Render a real dependency tree from entry files, following imports, guarding cycles. */
export const buildAscii = (
  roots: string[],
  files: Record<string, GraphFile>,
  maxNodes = 300,
): string => {
  if (!roots.length) return "(no entry file detected)";
  const lines: string[] = [];
  const expanded = new Set<string>();
  let count = 0;

  const walk = (id: string, prefix: string, isLast: boolean, isRoot: boolean) => {
    if (count >= maxNodes) return;
    const file = files[id];
    if (!file) return;
    count++;

    const branch = isRoot ? "" : isLast ? "└─ " : "├─ ";
    const cyclic = expanded.has(id) ? " (↻)" : "";
    lines.push(prefix + branch + file.path + cyclic);

    if (expanded.has(id)) return; // already shown its subtree — stop (cycle/shared)
    expanded.add(id);

    const children = file.imports;
    const childPrefix = isRoot ? "" : prefix + (isLast ? "   " : "│  ");
    children.forEach((child, i) => walk(child, childPrefix, i === children.length - 1, false));
  };

  roots.forEach((r, i) => walk(r, "", i === roots.length - 1, true));
  if (count >= maxNodes) lines.push(`… (${maxNodes}+ nodes, truncated)`);
  return lines.join("\n");
};
