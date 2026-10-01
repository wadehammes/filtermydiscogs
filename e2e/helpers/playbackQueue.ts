import { expect, type Page } from "@playwright/test";
import {
  NOW_PLAYING_REGION_LABEL,
  PLAYBACK_QUEUE_LIST_LABEL,
} from "src/constants/accessibilityLabels.constants";
import { e2eTrackTitle } from "src/tests/msw/e2eReleaseDetailData";
import {
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";

export const clickAddAlbumToQueue = async (page: Page, albumTitle: string) => {
  const button = page.getByRole("button", {
    name: `Add ${albumTitle} to queue`,
  });
  await button.scrollIntoViewIfNeeded();
  await button.click();
};

export const expectPlaybackQueueHasTwoTracks = async (page: Page) => {
  await expect(
    page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
  ).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: "Open playback queue, 2 tracks" }),
  ).toBeVisible({ timeout: 30_000 });
};

const collapseExpandedDockVideoIfNeeded = async (page: Page) => {
  const hideVideo = page.getByRole("button", { name: "Hide video" });

  if (await hideVideo.isVisible()) {
    await hideVideo.click();
  }
};

export const openPlaybackQueueDrawer = async (page: Page) => {
  await collapseExpandedDockVideoIfNeeded(page);

  const queueButton = page.getByRole("button", {
    name: "Open playback queue, 2 tracks",
  });
  await queueButton.scrollIntoViewIfNeeded();
  await queueButton.click();
  await expect(queueButton).toHaveAttribute("aria-expanded", "true", {
    timeout: 15_000,
  });
  await expect(
    page.getByRole("list", { name: PLAYBACK_QUEUE_LIST_LABEL }),
  ).toBeVisible({ timeout: 15_000 });
};

export const expectQueueTrackOrder = async (
  page: Page,
  trackTitlesInOrder: string[],
) => {
  const items = page
    .getByRole("list", { name: PLAYBACK_QUEUE_LIST_LABEL })
    .getByRole("listitem");
  await expect(items).toHaveCount(trackTitlesInOrder.length);

  for (const [index, title] of trackTitlesInOrder.entries()) {
    await expect(items.nth(index)).toContainText(title);
  }
};

export const e2eQueueTrackTwo = () => e2eTrackTitle(E2E_ALBUM_TWO);
export const e2eQueueTrackThree = () => e2eTrackTitle(E2E_ALBUM_THREE);
