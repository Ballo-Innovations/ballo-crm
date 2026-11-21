import { expect, type Page } from "@playwright/test";

/** Fails when the page scrolls sideways, which is how a broken 390px layout shows up. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(0);
}
