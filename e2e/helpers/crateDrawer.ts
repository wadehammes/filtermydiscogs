import { expect, type Page } from "@playwright/test";

export const ensureCratesSidePanelSelected = async (page: Page) => {
  const toggle = page.getByTestId("fmdCollectionSidePanelToggle");
  const cratesButton = toggle.getByRole("button", { name: /crates panel/i });

  if ((await cratesButton.getAttribute("aria-pressed")) !== "true") {
    await cratesButton.click();
  }
};

export const openMobileCrateDrawerFromFab = async (page: Page) => {
  await ensureCratesSidePanelSelected(page);

  const firstCrateItem = page.getByTestId("fmdCrateDrawerReleaseItem").first();
  const drawerAlreadyOpen = await firstCrateItem.isVisible().catch(() => false);

  if (!drawerAlreadyOpen) {
    const fab = page.getByTestId("fmdReleaseSidePanelFab");
    await expect(fab).toBeVisible({ timeout: 30_000 });
    await fab.click();
  }

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
