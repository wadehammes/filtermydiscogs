import { expect, type Locator, type Page } from "@playwright/test";
import { RELEASE_TRACKLIST_LABEL } from "src/constants/accessibilityLabels.constants";
import { e2eTrackTitle } from "src/tests/msw/e2eReleaseDetailData";

export const openReleaseModalFromCard = async (
  page: Page,
  card: Locator,
  albumTitle: string,
) => {
  await openReleaseModalByTitle(page, albumTitle, card);
};

export const openReleaseModalByTitle = async (
  page: Page,
  albumTitle: string,
  root: Locator | Page = page,
) => {
  await root
    .getByRole("button", { name: `Open release details for ${albumTitle}` })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
};

export const expectReleaseModalShowsE2eTracklist = async (
  page: Page,
  albumTitle: string,
) => {
  await expect(
    page.getByRole("list", { name: RELEASE_TRACKLIST_LABEL }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole("button", { name: `Play ${e2eTrackTitle(albumTitle)}` }),
  ).toBeVisible();
};

export const closeReleaseModal = async (page: Page) => {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0, {
    timeout: 15_000,
  });
};
