import { expect, type Page } from "@playwright/test";

export const openMobileCrateDrawerFromFab = async (page: Page) => {
  const fab = page.getByTestId("fmdReleaseCrateFab");
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(page.getByRole("dialog")).toBeVisible({
    timeout: 45_000,
  });
};

export const expectCrateDrawerShowsReleases = async (
  page: Page,
  expectedCount?: number,
) => {
  const items = page.getByTestId("fmdCrateDrawerReleaseItem");
  if (expectedCount !== undefined) {
    await expect(items).toHaveCount(expectedCount, { timeout: 30_000 });
    return;
  }
  await expect(items.first()).toBeVisible({ timeout: 30_000 });
};
