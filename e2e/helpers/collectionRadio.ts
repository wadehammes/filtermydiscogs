import { expect, type Page } from "@playwright/test";
import { searchReleasesCollection } from "./releasesCollection";

export const expectCollectionRadioPlayReady = async (page: Page) => {
  const playButton = page.getByTestId("fmdCollectionRadioPlayButton");

  await expect(playButton).toBeVisible({ timeout: 15_000 });
  await expect(playButton).not.toHaveAttribute("aria-disabled", "true", {
    timeout: 30_000,
  });
};

export const applyE2eCollectionRadioFilter = async (page: Page) => {
  await searchReleasesCollection(page, "E2E");
};

export const startE2eCollectionRadio = async (page: Page) => {
  await applyE2eCollectionRadioFilter(page);
  await expectCollectionRadioPlayReady(page);
  await page.getByTestId("fmdCollectionRadioPlayButton").click();
};
