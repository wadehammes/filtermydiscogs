import type { NetworkFixture } from "@msw/playwright";
import { expect, type Page } from "@playwright/test";
import {
  NOW_PLAYING_REGION_LABEL,
  PLAYBACK_QUEUE_LIST_LABEL,
} from "src/constants/accessibilityLabels.constants";
import { e2eTrackTitle } from "src/tests/msw/e2eReleaseDetailData";
import { createE2eDelayedReleaseByIdHandler } from "src/tests/msw/e2eReleaseHandlers";
import {
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
  E2E_DISCOGS_RELEASE_ID_ONE,
} from "src/tests/msw/e2eSession.constants";
import {
  closeReleaseModal,
  expectReleaseModalShowsE2eTracklist,
  openReleaseModalByTitle,
} from "./releaseModal";
import { gotoReleasesWorkspace } from "./releasesWorkspace";

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

export const openPlaybackQueueDrawer = async (page: Page, trackCount = 2) => {
  await collapseExpandedDockVideoIfNeeded(page);

  const queueButton = page.getByRole("button", {
    name: `Open playback queue, ${trackCount} tracks`,
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

export const expectNowPlayingTrackTitle = async (
  page: Page,
  albumTitle: string,
) => {
  await expect(
    page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
  ).toContainText(e2eTrackTitle(albumTitle), { timeout: 30_000 });
};

export const startE2eAlbumTrackPlayback = async (
  page: Page,
  albumTitle: string,
) => {
  await gotoReleasesWorkspace(page);
  await openReleaseModalByTitle(page, albumTitle);
  await expectReleaseModalShowsE2eTracklist(page, albumTitle);
  await page
    .getByRole("button", { name: `Play ${e2eTrackTitle(albumTitle)}` })
    .click();
  await closeReleaseModal(page);
  await expectNowPlayingTrackTitle(page, albumTitle);
};

export const reorderQueueDrawerItem = async (
  page: Page,
  trackTitle: string,
  overTrackTitle: string,
) => {
  const dragHandle = page.getByRole("button", {
    name: `Reorder ${trackTitle}`,
  });
  const dropTarget = page
    .getByRole("list", { name: PLAYBACK_QUEUE_LIST_LABEL })
    .getByRole("listitem")
    .filter({ hasText: overTrackTitle });

  await expect(dragHandle).toBeVisible({ timeout: 15_000 });
  await expect(dropTarget).toBeVisible({ timeout: 15_000 });
  await dragHandle.scrollIntoViewIfNeeded();
  await dropTarget.scrollIntoViewIfNeeded();

  const sourceBox = await dragHandle.boundingBox();
  const targetBox = await dropTarget.boundingBox();

  if (!(sourceBox && targetBox)) {
    throw new Error("Playback queue reorder targets are not visible");
  }

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(sourceX, sourceY - 12);
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.mouse.up();
};

export const stubE2eDelayedAlbumOneReleaseDetail = (
  network: NetworkFixture,
  delayMs: number,
  albumOneYoutubeVideoId?: string,
) =>
  network.use(
    createE2eDelayedReleaseByIdHandler({
      delayMs,
      delayedReleaseIds: new Set([String(E2E_DISCOGS_RELEASE_ID_ONE)]),
      ...(albumOneYoutubeVideoId !== undefined
        ? { albumOneYoutubeVideoId }
        : {}),
    }),
  );

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
