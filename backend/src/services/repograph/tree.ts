// Build a nested folder object from path -> fileId.
// { "backend": { "src": { "app.ts": "f12" } } }

export const buildTree = (byPath: Map<string, string>): Record<string, unknown> => {
  const root: Record<string, unknown> = {};
  for (const [path, fileId] of byPath) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dir = parts[i];
      if (typeof node[dir] !== "object" || node[dir] === null) node[dir] = {};
      node = node[dir] as Record<string, unknown>;
    }
    node[parts[parts.length - 1]] = fileId;
  }
  return root;
};
