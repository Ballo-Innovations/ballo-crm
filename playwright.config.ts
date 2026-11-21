import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests (`e2e/*.spec.ts`). They run on every pull request, and every UI ticket adds or
 * extends a spec in its own PR (docs/05-qa/01-test-strategy.md).
 *
 * Set E2E_BASE_URL to point the suite at an already-running app (for example the dev URL);
 * otherwise Playwright starts the app itself.
 */
const port = Number(process.env.PORT ?? 3000);
const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl ?? `http://localhost:${port}`;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // The definition of done requires every screen to work at 390px, so every spec runs there too.
    {
      name: "mobile-390",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
  webServer: externalBaseUrl
    ? undefined
    : {
        // CI serves the production build it has just made; locally the dev server is enough.
        command: isCi ? "node .next/standalone/server.js" : "pnpm dev",
        url: `${baseURL}/api/v1/health`,
        reuseExistingServer: !isCi,
        timeout: 120_000,
        env: { PORT: String(port), HOSTNAME: "127.0.0.1" },
      },
});
