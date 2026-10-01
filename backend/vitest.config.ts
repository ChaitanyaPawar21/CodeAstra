import { defineConfig } from "vitest/config";

// Source uses NodeNext ".js" specifiers for ".ts" files. Rewrite relative
// ".js" imports to extensionless so Vite resolves the real ".ts" source.
const jsToTs = {
  name: "js-to-ts",
  enforce: "pre" as const,
  async resolveId(source: string, importer: string | undefined) {
    if (importer && /^\.\.?\//.test(source) && source.endsWith(".js")) {
      const r = await (this as any).resolve(source.slice(0, -3), importer, { skipSelf: true });
      return r?.id ?? null;
    }
    return null;
  },
};

export default defineConfig({
  plugins: [jsToTs],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
