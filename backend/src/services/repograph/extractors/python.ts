import { LanguageExtractor, RawImport, Resolution, ResolveContext } from "../types.js";

const dirname = (p: string) => {
  const i = p.lastIndexOf("/");
  return i === -1 ? "" : p.slice(0, i);
};

const normalize = (p: string): string => {
  const out: string[] = [];
  for (const s of p.split("/")) {
    if (s === "" || s === ".") continue;
    if (s === "..") out.pop();
    else out.push(s);
  }
  return out.join("/");
};

const extract = (content: string) => {
  const imports: RawImport[] = [];
  const seen = new Set<string>();
  const add = (spec: string) => {
    if (!spec || seen.has(spec)) return;
    seen.add(spec);
    imports.push({ spec, kind: "import", typeOnly: false });
  };

  let m: RegExpExecArray | null;

  // from <mod> import ...   (mod may be relative: . .. .pkg)
  const fromRe = /^\s*from\s+(\.*[\w.]*)\s+import\s+/gm;
  while ((m = fromRe.exec(content))) add(m[1]);

  // import a.b, c.d
  const importRe = /^\s*import\s+([\w.]+(?:\s*,\s*[\w.]+)*)/gm;
  while ((m = importRe.exec(content))) {
    for (const part of m[1].split(",")) {
      const mod = part.trim().split(/\s+as\s+/)[0].trim();
      add(mod);
    }
  }

  const exportsSet = new Set<string>();
  const defRe = /^(?:def|class)\s+(\w+)/gm;
  while ((m = defRe.exec(content))) if (!m[1].startsWith("_")) exportsSet.add(m[1]);

  const annotations: string[] = [];
  if (/\burlpatterns\s*=/.test(content)) annotations.push("django-urls");
  if (/\(\s*models\.Model\s*\)/.test(content)) annotations.push("django-model");

  return { imports, exports: Array.from(exportsSet), annotations };
};

const hit = (base: string, fileSet: Set<string>): string | null => {
  if (fileSet.has(`${base}.py`)) return `${base}.py`;
  if (fileSet.has(`${base}/__init__.py`)) return `${base}/__init__.py`;
  return null;
};

const resolve = (spec: string, fromFile: string, ctx: ResolveContext): Resolution[] => {
  const dots = spec.match(/^\.*/)![0].length;

  if (dots > 0) {
    const mod = spec.slice(dots);
    let baseDir = dirname(fromFile);
    for (let i = 0; i < dots - 1; i++) baseDir = dirname(baseDir);
    const modPath = mod ? mod.split(".").join("/") : "";
    const target = normalize(baseDir + (modPath ? `/${modPath}` : ""));
    const found = mod ? hit(target, ctx.fileSet) : (ctx.fileSet.has(`${target}/__init__.py`) ? `${target}/__init__.py` : null);
    return found ? [{ kind: "internal", path: found }] : [{ kind: "unresolved" }];
  }

  // absolute: internal only if a matching file actually exists, else external
  const modPath = spec.split(".").join("/");
  for (const root of ["", "src/"]) {
    const found = hit(normalize(root + modPath), ctx.fileSet);
    if (found) return [{ kind: "internal", path: found }];
  }
  return [{ kind: "external", pkg: spec.split(".")[0] }];
};

export const pythonExtractor: LanguageExtractor = {
  id: "python",
  extensions: [".py"],
  extract,
  resolve,
};
