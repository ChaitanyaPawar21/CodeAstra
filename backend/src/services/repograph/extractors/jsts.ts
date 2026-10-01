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

const EXT = ["ts", "tsx", "js", "jsx", "mjs", "cjs"];

// Concrete file paths to probe for a resolved base path (no extension assumed).
function* candidates(p: string): Generator<string> {
  yield p;
  for (const e of EXT) yield `${p}.${e}`;
  for (const e of EXT) yield `${p}/index.${e}`;
  const m = p.match(/\.(js|jsx|mjs|cjs)$/); // ESM: import "./x.js" -> x.ts
  if (m) {
    const stem = p.slice(0, -m[0].length);
    for (const e of ["ts", "tsx"]) yield `${stem}.${e}`;
  }
}

const firstHit = (basePath: string, fileSet: Set<string>): string | null => {
  for (const c of candidates(basePath)) if (fileSet.has(c)) return c;
  return null;
};

const pkgName = (spec: string): string => {
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
};

// Try tsconfig `paths` aliases; returns a resolved repo path or null.
const tryTsPaths = (spec: string, ctx: ResolveContext): string | null => {
  if (!ctx.tsPaths) return null;
  const { baseUrl, paths } = ctx.tsPaths;
  for (const key of Object.keys(paths)) {
    const star = key.indexOf("*");
    for (const target of paths[key]) {
      if (star === -1) {
        if (key === spec) {
          const hit = firstHit(normalize(`${baseUrl}/${target}`), ctx.fileSet);
          if (hit) return hit;
        }
        continue;
      }
      const prefix = key.slice(0, star);
      const suffix = key.slice(star + 1);
      if (spec.startsWith(prefix) && spec.endsWith(suffix)) {
        const wild = spec.slice(prefix.length, spec.length - suffix.length);
        const resolved = target.replace("*", wild);
        const hit = firstHit(normalize(`${baseUrl}/${resolved}`), ctx.fileSet);
        if (hit) return hit;
      }
    }
  }
  return null;
};

const extract = (content: string) => {
  const imports: RawImport[] = [];
  const seen = new Set<string>();
  const add = (spec: string, kind: RawImport["kind"], typeOnly: boolean) => {
    const sig = `${kind}:${typeOnly}:${spec}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    imports.push({ spec, kind, typeOnly });
  };

  let m: RegExpExecArray | null;

  const staticRe = /import\s+(type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;
  while ((m = staticRe.exec(content))) add(m[2], "import", !!m[1]);

  const dynRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynRe.exec(content))) add(m[1], "dynamic", false);

  const reqRe = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = reqRe.exec(content))) add(m[1], "require", false);

  const reExportRe = /export\s+(type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']/g;
  while ((m = reExportRe.exec(content))) add(m[2], "re-export", !!m[1]);

  // Exports
  const exportsSet = new Set<string>();
  const namedDecl =
    /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+(\w+)/g;
  while ((m = namedDecl.exec(content))) exportsSet.add(m[1]);
  const namedList = /export\s*\{([^}]+)\}/g;
  while ((m = namedList.exec(content))) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
      if (name) exportsSet.add(name);
    }
  }
  if (/export\s+default\b/.test(content)) exportsSet.add("default");

  // Framework signals -> annotations
  const annotations: string[] = [];
  if (/\b(?:router|app)\.(?:get|post|put|delete|patch|use|all)\s*\(/.test(content) ||
      /express\.Router\s*\(/.test(content)) {
    annotations.push("express-router");
  }
  if (/@Controller\s*\(/.test(content)) annotations.push("nest-controller");
  if (/@Injectable\s*\(/.test(content)) annotations.push("nest-service");
  if (/@Module\s*\(/.test(content)) annotations.push("nest-module");

  return { imports, exports: Array.from(exportsSet), annotations };
};

const resolve = (spec: string, fromFile: string, ctx: ResolveContext): Resolution[] => {
  const isLocal = spec.startsWith(".") || spec.startsWith("/");

  if (!isLocal) {
    const aliased = tryTsPaths(spec, ctx);
    if (aliased) return [{ kind: "internal", path: aliased }];
    return [{ kind: "external", pkg: pkgName(spec) }];
  }

  const base = spec.startsWith("/")
    ? normalize(spec)
    : normalize(`${dirname(fromFile)}/${spec}`);
  const hit = firstHit(base, ctx.fileSet);
  return hit ? [{ kind: "internal", path: hit }] : [{ kind: "unresolved" }];
};

export const jstsExtractor: LanguageExtractor = {
  id: "jsts",
  extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
  extract,
  resolve,
};
