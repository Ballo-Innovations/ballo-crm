import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Integration tests: `*.int.test.ts`, server actions and queries against a real Postgres
 * (`DATABASE_URL`). Run `docker compose up -d db` and `pnpm db:deploy` first.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    passWithNoTests: true,
    // One database is shared by every file, so files must not run at the same time.
    fileParallelism: false,
  },
});
