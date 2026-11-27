import { expect, test, type Page } from "@playwright/test";

import { expectNoHorizontalScroll, signIn } from "./helpers";

// E2-01: accounts list - paginated, sortable, search, sector/tier/lifecycle filters (seed v0).
const password = process.env.E2E_PASSWORD ?? "Compass!2026";

async function signInAs(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 15_000 });
}

/** Account names in display order, from the table (desktop) or the cards (phone). */
async function accountNames(page: Page) {
  return page.locator("[data-account-name]:visible").allTextContents();
}

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;

test("lists every account by ARR, highest first, with a count", async ({ page }) => {
  await signIn(page);
  await page.goto("/accounts");
  await expect(page.getByRole("heading", { level: 1, name: "Accounts" })).toBeVisible();
  await expect(page.getByText("5 of 5")).toBeVisible();
  expect(await accountNames(page)).toEqual([
    "Zambezi Commercial Bank",
    "ZedMobile",
    "Konkola Copper Resources",
    "MegaMart Zambia",
    "SolarZed",
  ]);
  await expectNoHorizontalScroll(page);
});

test("search narrows the list, and no results offers a way back", async ({ page }) => {
  await signIn(page);
  await page.goto("/accounts");
  const search = page.getByRole("searchbox", { name: "Search accounts" });

  await search.fill("kitwe");
  await expect(page).toHaveURL(/q=kitwe/);
  await expect.poll(() => accountNames(page)).toEqual(["MegaMart Zambia"]);
  await expect(page.getByText("1 of 5")).toBeVisible();

  await search.fill("no such company");
  await expect(page.getByRole("heading", { name: "No accounts match" })).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect.poll(async () => (await accountNames(page)).length).toBe(5);
});

test("filters by sector from the Filters panel, shown as a removable chip", async ({ page }) => {
  await signIn(page);
  await page.goto("/accounts");
  await page.getByRole("button", { name: /^Filters/ }).click();
  await page.getByRole("checkbox", { name: "Banking" }).click();
  await page.getByRole("checkbox", { name: "Retail" }).click();
  await page.keyboard.press("Escape");

  await expect(page).toHaveURL(/sector=BANKING%2CRETAIL|sector=BANKING,RETAIL/);
  await expect
    .poll(async () => (await accountNames(page)).sort())
    .toEqual(["MegaMart Zambia", "Zambezi Commercial Bank"]);
  await expect(page.getByRole("button", { name: "Remove Sector: Banking" })).toBeVisible();

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).not.toHaveURL(/sector=/);
  await expect.poll(async () => (await accountNames(page)).length).toBe(5);
});

test("filters from a shared URL, tier and lifecycle together", async ({ page }) => {
  await signIn(page);
  await page.goto("/accounts?tier=TIER2&lifecycle=AT_RISK");
  expect(await accountNames(page)).toEqual(["MegaMart Zambia"]);
  await expect(page.getByRole("button", { name: /^Filters/ })).toContainText("2");
});

test("sorts by a column header, both ways", async ({ page }) => {
  test.skip(isPhone(page), "headers are a table feature; phones use the Sort menu");
  await signIn(page);
  await page.goto("/accounts");
  const header = page.getByRole("columnheader", { name: "Account" });

  await header.getByRole("button").click();
  await expect(page).toHaveURL(/sort=name/);
  await expect(header).toHaveAttribute("aria-sort", "ascending");
  await expect
    .poll(() => accountNames(page))
    .toEqual([
      "Konkola Copper Resources",
      "MegaMart Zambia",
      "SolarZed",
      "Zambezi Commercial Bank",
      "ZedMobile",
    ]);

  await header.getByRole("button").click();
  await expect(page).toHaveURL(/sort=-name/);
  await expect(header).toHaveAttribute("aria-sort", "descending");
  await expect.poll(async () => (await accountNames(page))[0]).toBe("ZedMobile");
});

test("on a phone the Sort menu sorts the cards", async ({ page }) => {
  test.skip(!isPhone(page), "phone layout only");
  await signIn(page);
  await page.goto("/accounts");
  await page.getByRole("combobox", { name: "Sort by" }).selectOption("name");
  await expect(page).toHaveURL(/sort=name/);
  await expect.poll(async () => (await accountNames(page))[0]).toBe("Konkola Copper Resources");
});

test("pages through results", async ({ page }) => {
  await signIn(page);
  await page.goto("/accounts?sort=name&pageSize=2");
  const pager = page.getByRole("navigation", { name: "Pagination" });
  await expect(pager.getByText("Page 1 of 3")).toBeVisible();
  await expect(pager.getByRole("button", { name: "Previous page" })).toBeDisabled();

  await pager.getByRole("button", { name: "Next page" }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect.poll(() => accountNames(page)).toEqual(["SolarZed", "Zambezi Commercial Bank"]);

  await pager.getByRole("button", { name: "Next page" }).click();
  await expect.poll(() => accountNames(page)).toEqual(["ZedMobile"]);
  await expect(pager.getByRole("button", { name: "Next page" })).toBeDisabled();
});

test("a sales rep sees only their team's accounts (TC-03)", async ({ page }) => {
  await signInAs(page, "mutale@compass.zm");
  await page.goto("/accounts?sort=name");
  await expect(page.getByText("3 of 3")).toBeVisible();
  expect(await accountNames(page)).toEqual([
    "Konkola Copper Resources",
    "SolarZed",
    "Zambezi Commercial Bank",
  ]);
});
