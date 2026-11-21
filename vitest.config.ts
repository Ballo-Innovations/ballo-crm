import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

/**
 * Unit tests: `*.test.ts` next to the code, no database, no network.
 * Integration tests (`*.int.test.ts`) need Postgres and run through `vitest.int.config.ts`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    exclude: [...configDefaults.exclude, "src/**/*.int.test.ts"],
    // next-auth imports "next/server" without an extension, which Node's ESM loader rejects;
    // letting Vite process it resolves the import.
    server: { deps: { inline: ["next-auth"] } },
    coverage: {
      provider: "v8",
      // Business logic lives in `service.ts` as pure functions; that is what the floor protects.
      include: ["src/modules/**/service.ts"],
      reporter: ["text", "html"],
      thresholds: { perFile: true, lines: 90, functions: 90, statements: 90, branches: 80 },
    },
  },
});
