import { LanguageExtractor, RawImport, Resolution, ResolveContext } from "../types.js";

const extract = (content: string) => {
  const imports: RawImport[] = [];
  const seen = new Set<string>();
  const add = (spec: string) => {
    if (!spec || seen.has(spec)) return;
    seen.add(spec);
    imports.push({ spec, kind: "import", typeOnly: false });
  };

  let m: RegExpExecArray | null;
  const importRe = /^\s*import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;/gm;
  while ((m = importRe.exec(content))) add(m[1]);

  const exportsSet = new Set<string>();
  const typeRe = /public\s+(?:abstract\s+|final\s+)?(?:class|interface|enum|record)\s+(\w+)/g;
  while ((m = typeRe.exec(content))) exportsSet.add(m[1]);

  const annotations: string[] = [];
  if (/@RestController\b|@Controller\b/.test(content)) annotations.push("spring-rest");
  if (/@Service\b/.test(content)) annotations.push("spring-service");
  if (/@Repository\b/.test(content)) annotations.push("spring-repository");
  if (/@Entity\b/.test(content)) annotations.push("spring-entity");

  return { imports, exports: Array.from(exportsSet), annotations };
};

const resolve = (spec: string, _fromFile: string, ctx: ResolveContext): Resolution[] => {
  // ponytail: O(files) scan per import; build a suffix index on ctx if Java repos get slow.
  if (spec.endsWith(".*")) {
    const dir = spec.slice(0, -2).split(".").join("/"); // a.b.* -> a/b
    const out: Resolution[] = [];
    for (const p of ctx.fileSet) {
      if (p.endsWith(".java")) {
        const d = p.slice(0, p.lastIndexOf("/"));
        if (d === dir || d.endsWith(`/${dir}`)) out.push({ kind: "internal", path: p });
      }
    }
    return out.length ? out : [{ kind: "external", pkg: spec.split(".").slice(0, 2).join(".") }];
  }

  const suffix = spec.split(".").join("/") + ".java"; // a.b.C -> a/b/C.java
  for (const p of ctx.fileSet) {
    if (p === suffix || p.endsWith(`/${suffix}`)) return [{ kind: "internal", path: p }];
  }
  return [{ kind: "external", pkg: spec.split(".").slice(0, 2).join(".") }];
};

export const javaExtractor: LanguageExtractor = {
  id: "java",
  extensions: [".java"],
  extract,
  resolve,
};
