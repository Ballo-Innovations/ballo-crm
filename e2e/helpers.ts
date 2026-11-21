import { expect, type Page } from "@playwright/test";

/** Fails when the page scrolls sideways, which is how a broken 390px layout shows up. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(0);
}

/** The seeded admin (E0-10); override with E2E_EMAIL / E2E_PASSWORD. */
export const e2eUser = {
  email: process.env.E2E_EMAIL ?? "admin@compass.zm",
  password: process.env.E2E_PASSWORD ?? "Compass!2026",
};

/** Signs in through the login form and waits for the redirect away from /login. */
export async function signIn(page: Page, password = e2eUser.password) {
  if (!new URL(page.url()).pathname.startsWith("/login")) await page.goto("/login");
  await page.getByLabel("Work email").fill(e2eUser.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 });
}
