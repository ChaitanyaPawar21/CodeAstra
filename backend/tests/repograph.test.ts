import { describe, it, expect } from "vitest";
import { buildRepoGraph } from "../src/services/repograph/build.js";
import type { FetchedFile, RepoGraph } from "../src/services/repograph/types.js";

const NO_TRUNC = { truncated: false, truncatedReason: null };

const file = (path: string, content: string): FetchedFile => ({ path, content });

const find = (g: RepoGraph, path: string) => {
  const entry = Object.entries(g.files).find(([, f]) => f.path === path);
  if (!entry) throw new Error(`file not found in graph: ${path}`);
  return entry; // [id, GraphFile]
};

// importedBy must be the exact inverse of imports for every file.
const assertInverse = (g: RepoGraph) => {
  const expected = new Map<string, Set<string>>();
  for (const id of Object.keys(g.files)) expected.set(id, new Set());
  for (const [id, f] of Object.entries(g.files)) {
    for (const t of f.imports) expected.get(t)!.add(id);
  }
  for (const [id, f] of Object.entries(g.files)) {
    expect(new Set(f.importedBy)).toEqual(expected.get(id));
  }
};

describe("repograph — JS/TS with tsconfig aliases + index files", () => {
  const files: FetchedFile[] = [
    file("tsconfig.json", JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["src/*"] } } })),
    file("src/app.ts", `import express from "express";\nimport { userRouter } from "./routes/user.route.js";\nimport { log } from "@/utils/log";\nimport { config } from "./config.js";\n`),
    file("src/config.ts", `export const config = {};`),
    file("src/routes/user.route.ts", `import { getUser } from "../controllers/user.controller.js";\nconst router = express.Router();\nrouter.get("/", getUser);\nexport const userRouter = router;`),
    file("src/controllers/user.controller.ts", `import { findUser } from "../services/user.service.js";\nexport const getUser = () => findUser();`),
    file("src/services/user.service.ts", `import { User } from "../models/index.js";\nexport const findUser = () => new User();`),
    file("src/models/index.ts", `export * from "./user.model.js";`),
    file("src/models/user.model.ts", `export class User {}`),
    file("src/utils/log.ts", `export const log = () => {};`),
  ];
  const g = buildRepoGraph(files, NO_TRUNC);

  it("resolves .js->.ts, index files, and tsconfig aliases", () => {
    const [appId, app] = find(g, "src/app.ts");
    const importPaths = app.imports.map((id) => g.files[id].path);
    expect(importPaths).toContain("src/routes/user.route.ts"); // .js -> .ts
    expect(importPaths).toContain("src/utils/log.ts"); // @/ alias
    expect(importPaths).toContain("src/config.ts");
    expect(app.externalPackages).toContain("express");
    const [svcId] = find(g, "src/services/user.service.ts");
    expect(g.files[svcId].imports.map((id) => g.files[id].path)).toContain("src/models/index.ts"); // /index
    expect(appId).toBeTruthy();
  });

  it("assigns layers from conventions/annotations", () => {
    expect(find(g, "src/routes/user.route.ts")[1].layer).toBe("route");
    expect(find(g, "src/controllers/user.controller.ts")[1].layer).toBe("controller");
    expect(find(g, "src/services/user.service.ts")[1].layer).toBe("service");
    expect(find(g, "src/models/user.model.ts")[1].layer).toBe("model");
    expect(find(g, "src/app.ts")[1].layer).toBe("entry"); // no importers, imports 3
  });

  it("keeps importedBy as the exact inverse of imports", () => assertInverse(g));
});

describe("repograph — Python package with relative imports", () => {
  const files: FetchedFile[] = [
    file("pkg/__init__.py", ``),
    file("pkg/main.py", `import os\nfrom .service import run\nfrom .models.user import User\n`),
    file("pkg/service.py", `from .models import user\n`),
    file("pkg/models/__init__.py", ``),
    file("pkg/models/user.py", `class User:\n    pass\n`),
  ];
  const g = buildRepoGraph(files, NO_TRUNC);

  it("resolves relative imports to files / packages, os is external", () => {
    const [, main] = find(g, "pkg/main.py");
    const imp = main.imports.map((id) => g.files[id].path);
    expect(imp).toContain("pkg/service.py");
    expect(imp).toContain("pkg/models/user.py");
    expect(main.externalPackages).toContain("os");
    const [, svc] = find(g, "pkg/service.py");
    expect(svc.imports.map((id) => g.files[id].path)).toContain("pkg/models/__init__.py");
  });

  it("keeps importedBy as the exact inverse of imports", () => assertInverse(g));
});

describe("repograph — Spring-style Java", () => {
  const files: FetchedFile[] = [
    file("src/main/java/com/app/UserController.java", `package com.app;\nimport com.app.UserService;\n@RestController\npublic class UserController {}`),
    file("src/main/java/com/app/UserService.java", `package com.app;\nimport com.app.UserRepository;\n@Service\npublic class UserService {}`),
    file("src/main/java/com/app/UserRepository.java", `package com.app;\n@Repository\npublic interface UserRepository {}`),
  ];
  const g = buildRepoGraph(files, NO_TRUNC);

  it("resolves FQN imports by path suffix and layers by annotation", () => {
    const [, ctrl] = find(g, "src/main/java/com/app/UserController.java");
    expect(ctrl.imports.map((id) => g.files[id].path)).toContain("src/main/java/com/app/UserService.java");
    expect(ctrl.layer).toBe("controller");
    expect(find(g, "src/main/java/com/app/UserService.java")[1].layer).toBe("service");
    expect(find(g, "src/main/java/com/app/UserRepository.java")[1].layer).toBe("repository");
  });

  it("keeps importedBy as the exact inverse of imports", () => assertInverse(g));
});

describe("repograph — circular imports", () => {
  const files: FetchedFile[] = [
    file("src/a.ts", `import "./b.js";\nexport const a = 1;`),
    file("src/b.ts", `import "./a.js";\nexport const b = 1;`),
  ];
  const g = buildRepoGraph(files, NO_TRUNC);

  it("detects the a<->b cycle", () => {
    const [aId] = find(g, "src/a.ts");
    const [bId] = find(g, "src/b.ts");
    const cycle = g.cycles.find((c) => c.includes(aId) && c.includes(bId));
    expect(cycle).toBeDefined();
    expect(cycle!.length).toBe(2);
  });
});

describe("repograph — unsupported language", () => {
  const files: FetchedFile[] = [
    file("src/app.ts", `export const x = 1;`),
    file("cmd/main.go", `package main\nfunc main() {}`),
  ];
  const g = buildRepoGraph(files, NO_TRUNC);

  it("includes the file as a node with no edges and records the language", () => {
    const [, go] = find(g, "cmd/main.go");
    expect(go.language).toBe("other");
    expect(go.imports).toHaveLength(0);
    expect(g.stats.unsupportedLanguages).toContain("go");
  });
});

describe("repograph — truncation", () => {
  it("passes truncation through to stats", () => {
    const g = buildRepoGraph([file("src/a.ts", `export const a = 1;`)], {
      truncated: true,
      truncatedReason: "kept 1 of 9999 files",
    });
    expect(g.stats.truncated).toBe(true);
    expect(g.stats.truncatedReason).toBe("kept 1 of 9999 files");
  });
});
