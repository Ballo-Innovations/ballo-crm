import { expect, test, type Page } from "@playwright/test";

// E0-05: each role sees only what it may (TC-01) and a rep cannot open Settings by URL (TC-02).
// Signs in as seeded users (E0-10); all share the demo password.
const password = process.env.E2E_PASSWORD ?? "Compass!2026";

async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 });
}

async function navLinks(page: Page) {
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) await menu.click();
  return page.getByRole("complementary", { name: "Main navigation" }).getByRole("link");
}

test("a sales rep has no Settings in the nav and gets 403 opening it by URL", async ({ page }) => {
  await signInAs(page, "mutale@compass.zm");
  const links = await navLinks(page);
  await expect(links.filter({ hasText: "Accounts" })).toHaveCount(1);
  await expect(links.filter({ hasText: "Settings" })).toHaveCount(0);

  const response = await page.goto("/settings");
  expect(response?.status()).toBe(403);
  await expect(
    page.getByRole("heading", { level: 1, name: "You don't have access" }),
  ).toBeVisible();
});

test("an admin sees Settings in the nav and can open it", async ({ page }) => {
  await signInAs(page, "admin@compass.zm");
  const links = await navLinks(page);
  await expect(links.filter({ hasText: "Settings" })).toHaveCount(1);

  const response = await page.goto("/settings");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
});
