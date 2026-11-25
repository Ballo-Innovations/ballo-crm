import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    // next-auth imports "next/server" without an extension, which Node's ESM loader rejects;
    // letting Vite process it resolves the import.
    server: { deps: { inline: ["next-auth"] } },
  },
});
