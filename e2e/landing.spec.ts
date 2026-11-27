import { expect, test } from "@playwright/test";

import { expectNoHorizontalScroll } from "./helpers";

// Landing page, option A "Product stage" with gradient waves
// (docs/03-design/01-design-system.md "Landing page"). Public, every section reachable,
// the product preview switches screens, no sideways scroll on phones.

test("a signed-out visitor sees the landing page, not the login page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The commercial picture, in one place.",
  );
});

test("the header links jump to each section", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Sections" }).first();
  for (const [name, id] of [
    ["Product", "product"],
    ["Features", "features"],
    ["Who it's for", "roles"],
  ] as const) {
    await nav.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("the product preview switches between Dashboard, Pipeline and Accounts", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/#product");
  const preview = page.locator("#product");
  const tabs = preview.getByRole("tablist", { name: "Product preview" });

  await expect(tabs.getByRole("tab", { name: "Dashboard" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(preview.getByRole("tabpanel")).toContainText("Weighted pipeline");

  await tabs.getByRole("tab", { name: "Pipeline" }).click();
  await expect(tabs.getByRole("tab", { name: "Pipeline" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(preview.getByRole("tabpanel")).toContainText("Negotiate");

  await tabs.getByRole("tab", { name: "Accounts" }).click();
  await expect(preview.getByRole("tabpanel")).toContainText("Buying committee");
});

test("the wave backgrounds are decorative and hidden from screen readers", async ({ page }) => {
  await page.goto("/");
  const waves = page.locator("[data-wave]");
  expect(await waves.count()).toBeGreaterThanOrEqual(2);
  for (const wave of await waves.all()) {
    await expect(wave).toHaveAttribute("aria-hidden", "true");
  }
});

test("Sign in in the header goes to the login page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("the closing panel's Sign in goes to the login page", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator("#sign-in").getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("at 390px the page never scrolls sideways and the menu opens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expectNoHorizontalScroll(page);

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("banner").getByRole("navigation", { name: "Sections" }).last();
  await expect(menu.getByRole("link", { name: "Features" })).toBeVisible();
  await menu.getByRole("link", { name: "Features" }).click();
  await expect(page.locator("#features")).toBeInViewport();
});
