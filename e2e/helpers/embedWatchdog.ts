import type { NetworkFixture } from "@msw/playwright";
import { expect, type Page } from "@playwright/test";
import { HttpResponse, http } from "msw";
import { E2E_EMBED_MOCK_DELAYED_PLAYING_MS } from "src/constants/e2eEmbedMock.constants";
import {
  buildE2eReleaseDetailByDiscogsId,
  buildE2eReleaseDetailWithYoutubeVideoId,
  e2eTrackTitle,
} from "src/tests/msw/e2eReleaseDetailData";
import {
  E2E_ALBUM_ONE,
  E2E_DISCOGS_RELEASE_ID_ONE,
} from "src/tests/msw/e2eSession.constants";
import {
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_LOADING_REARMS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS,
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS,
} from "src/utils/playbackEmbedStartWatchdog";
import {
  closeReleaseModal,
  expectReleaseModalShowsE2eTracklist,
  openReleaseModalByTitle,
} from "./releaseModal";
import { gotoReleasesWorkspace } from "./releasesWorkspace";

export const E2E_WATCHDOG_SKIP_REASON =
  "Private, removed, blocked, or still loading";

export const E2E_YOUTUBE_ERROR_SKIP_REASON = "Private or removed on YouTube";

export const e2eWatchdogMinDelayBeforePlayingMs = () =>
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS + 500;

export const e2eWatchdogNoSkipWaitMs = () =>
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_MS *
    (1 + PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_LOADING_REARMS) +
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS +
  2000;

export const e2eWatchdogDelayedNoSkipWaitMs = () =>
  Math.max(e2eWatchdogNoSkipWaitMs(), E2E_EMBED_MOCK_DELAYED_PLAYING_MS + 2000);

export const e2eWatchdogSkipVisibleTimeoutMs = () =>
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_SLOW_MS *
    (1 + PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_LOADING_REARMS) +
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_AFTER_SKIP_BONUS_MS +
  3000;

export const expectE2ePersistentEmbedSrcMatches = async (
  page: Page,
  pattern: RegExp,
) => {
  await expect(page.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
    "src",
    pattern,
    { timeout: 15_000 },
  );
};

export const stubE2eReleaseDetailWithYoutubeVideoId = (
  network: NetworkFixture,
  youtubeVideoId: string,
) => {
  const defaultDetails = buildE2eReleaseDetailByDiscogsId();

  return network.use(
    http.get("/api/release/:id", ({ params }) => {
      const releaseId = String(params.id);

      if (releaseId === String(E2E_DISCOGS_RELEASE_ID_ONE)) {
        return HttpResponse.json(
          buildE2eReleaseDetailWithYoutubeVideoId(
            E2E_DISCOGS_RELEASE_ID_ONE,
            E2E_ALBUM_ONE,
            youtubeVideoId,
          ),
        );
      }

      const detail = defaultDetails.get(releaseId);

      if (!detail) {
        return HttpResponse.json(
          { error: "Release not found" },
          { status: 404 },
        );
      }

      return HttpResponse.json(detail);
    }),
  );
};

export const startE2eAlbumOneTrackPlayback = async (page: Page) => {
  await gotoReleasesWorkspace(page);
  await openReleaseModalByTitle(page, E2E_ALBUM_ONE);
  await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);
  await page
    .getByRole("button", { name: `Play ${e2eTrackTitle(E2E_ALBUM_ONE)}` })
    .click();
  await closeReleaseModal(page);
};

export const expectPlaybackSkipReasonVisible = async (
  page: Page,
  reason: string,
) => {
  await expect(page.getByText(reason, { exact: false })).toBeVisible({
    timeout: e2eWatchdogSkipVisibleTimeoutMs(),
  });
};

export const expectNoPlaybackSkipReason = async (
  page: Page,
  reason: string,
  waitMs: number,
) => {
  await page.waitForTimeout(waitMs);
  await expect(page.getByText(reason, { exact: false })).toHaveCount(0);
};
