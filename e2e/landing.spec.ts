import { expect, test } from "@playwright/test";

// Landing page: public, in the app's design, every section reachable, no sideways scroll on phones.

test("a signed-out visitor sees the landing page, not the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Every account, deal and contract in one calm place",
  );
});

test("the header links jump to each section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Sections" }).first();
  for (const [name, id] of [
    ["Platform", "platform"],
    ["Grading", "grading"],
    ["Modules", "modules"],
    ["Who it's for", "personas"],
  ] as const) {
    await nav.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("the grading section shows the spec's worked example as Gold · 58", async ({ page }) => {
  await page.goto("/#grading");
  await expect(page.locator("#grading").getByText("Gold · 58")).toBeVisible();
});

test("Sign in goes to the login page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("Open the app sends a signed-out visitor to sign in first", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Open the app" }).click();
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
});

test("at 390px the page never scrolls sideways and the menu opens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Open the app" })).toBeVisible();
});
