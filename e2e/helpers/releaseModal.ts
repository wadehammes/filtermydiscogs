import { expect, type Locator, type Page } from "@playwright/test";
import { RELEASE_TRACKLIST_LABEL } from "src/constants/accessibilityLabels.constants";
import { e2eTrackTitle } from "src/tests/msw/e2eReleaseDetailData";

const waitForReleaseDetailFetch = (page: Page) =>
  page.waitForResponse(
    (response) => {
      try {
        const url = new URL(response.url());
        return (
          url.pathname.startsWith("/api/release/") &&
          response.request().method() === "GET" &&
          response.ok()
        );
      } catch {
        return false;
      }
    },
    { timeout: 30_000 },
  );

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
  const releaseDetailLoaded = waitForReleaseDetailFetch(page);
  await root
    .getByRole("button", { name: `Open release details for ${albumTitle}` })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await releaseDetailLoaded;
};

export const expectReleaseModalShowsE2eTracklist = async (
  page: Page,
  albumTitle: string,
) => {
  await expect(
    page.getByRole("list", { name: RELEASE_TRACKLIST_LABEL }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: `Play ${e2eTrackTitle(albumTitle)}` }),
  ).toBeVisible({
    timeout: 30_000,
  });
};

export const addAllPlayableTracksToQueueFromReleaseModal = async (
  page: Page,
) => {
  const trigger = page.getByTestId("fmdReleaseTracklistAddAllButton");
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const panel = page.getByTestId("fmdReleaseTracklistAddAllMenuPanel");
  await expect(panel).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
};

export const closeReleaseModal = async (page: Page) => {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0, {
    timeout: 15_000,
  });
};
