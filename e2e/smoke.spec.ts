import { expect, test } from "@playwright/test";

import { primaryNav, siteConfig } from "../src/lib/site";
import { expectNoHorizontalScroll, signIn } from "./helpers";

test("health endpoint is public and reports ok", async ({ request }) => {
  const response = await request.get("/api/v1/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data.status).toBe("ok");
});

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(new RegExp(siteConfig.name));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

for (const item of primaryNav) {
  test(`${item.title} module page renders without sideways scroll`, async ({ page }) => {
    await signIn(page);
    await page.goto(item.href);
    await expect(page.getByRole("heading", { level: 1, name: item.title })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}
