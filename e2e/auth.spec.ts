import { expect, test, type Page } from "@playwright/test";

// E0-04: login, logout, role in the session, protected routes redirect.
// Signs in as the admin that the seed creates (E0-10); override with E2E_EMAIL / E2E_PASSWORD.
const email = process.env.E2E_EMAIL ?? "admin@ballocrm.test";
const password = process.env.E2E_PASSWORD ?? "ballocrm-demo";

async function fillAndSubmit(page: Page, withPassword: string) {
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(withPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
}

/** Signs in and waits for the redirect; the first sign-in on a cold server can take a few seconds. */
async function signIn(page: Page) {
  await fillAndSubmit(page, password);
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 });
}

test("a signed-out visitor is sent to the login page, then back where they were going", async ({
  page,
}) => {
  await page.goto("/accounts");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Faccounts/);
  await expect(page.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();

  await signIn(page);
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByRole("heading", { level: 1, name: "Accounts" })).toBeVisible();
});

test("a wrong password shows an error and stays on the login page", async ({ page }) => {
  await page.goto("/login");
  await fillAndSubmit(page, "not-the-password");
  // Filtered by text: Next.js also renders an (empty) role="alert" route announcer.
  await expect(page.getByRole("alert").filter({ hasText: "don't match" })).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("the signed-in user and their role show in the sidebar, and sign out ends the session", async ({
  page,
}) => {
  await page.goto("/login");
  await signIn(page);
  await expect(page).toHaveURL(/\/dashboard$/);

  // At 390px the sidebar is a drawer behind the menu button.
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) await menu.click();
  const sidebar = page.getByRole("complementary", { name: "Main navigation" });
  await expect(sidebar.getByText("Admin", { exact: true })).toBeVisible();

  await sidebar.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fdashboard/);
});

test("a signed-out API call gets 401, not a redirect", async ({ request }) => {
  const response = await request.get("/api/v1/accounts", { maxRedirects: 0 });
  expect(response.status()).toBe(401);
  expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
});
