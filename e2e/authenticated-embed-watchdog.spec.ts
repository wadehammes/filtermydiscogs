import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { E2E_TAG_FULL_SUITE } from "./e2eProjectTags.constants";
import { expect, test } from "./fixtures/msw.fixture";
import {
  E2E_EMBED_DISABLED_SKIP_REASON,
  E2E_WATCHDOG_SKIP_REASON,
  E2E_YOUTUBE_ERROR_SKIP_REASON,
  e2eWatchdogDelayedNoSkipWaitMs,
  e2eWatchdogNoSkipWaitMs,
  expectE2ePersistentEmbedSrcMatches,
  expectNoPlaybackSkipReason,
  expectPlaybackSkipReasonVisible,
  startE2eAlbumOneTrackPlayback,
  stubE2eReleaseDetailWithYoutubeVideoId,
} from "./helpers/embedWatchdog";
import { expectE2eNowPlayingShowsPauseControl } from "./helpers/embedTransportSync";

test.describe("authenticated embed watchdog harness (MSW + mock iframe)", () => {
  test.describe.configure({ timeout: 90_000 });
  test("normal mock confirms playback without watchdog skip", {
    tag: E2E_TAG_FULL_SUITE,
  }, async ({ page, network }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    await startE2eAlbumOneTrackPlayback(page);

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 15_000 });

    await expectNoPlaybackSkipReason(
      page,
      E2E_WATCHDOG_SKIP_REASON,
      e2eWatchdogNoSkipWaitMs(),
    );

    await expectE2eNowPlayingShowsPauseControl(page);
  });

  test("silent mock wires mode=silent on the persistent embed iframe", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.silent,
    );
    await startE2eAlbumOneTrackPlayback(page);

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 15_000 });

    await expectE2ePersistentEmbedSrcMatches(page, /mode=silent/);
  });

  test("silent mock matches watchdog unavailable skip after embed load", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.silent,
    );
    await startE2eAlbumOneTrackPlayback(page);

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 15_000 });

    await expectE2ePersistentEmbedSrcMatches(page, /mode=silent/);

    await expectPlaybackSkipReasonVisible(page, E2E_WATCHDOG_SKIP_REASON);
  });

  test("error mock skips via YouTube onError without waiting for watchdog", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.error,
    );
    await startE2eAlbumOneTrackPlayback(page);

    await expectPlaybackSkipReasonVisible(page, E2E_YOUTUBE_ERROR_SKIP_REASON);
  });

  test("delayed mock confirms after watchdog window when delay exceeds threshold", {
    tag: E2E_TAG_FULL_SUITE,
  }, async ({ page, network }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.delayed,
    );
    await startE2eAlbumOneTrackPlayback(page);

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 15_000 });

    await expectNoPlaybackSkipReason(
      page,
      E2E_WATCHDOG_SKIP_REASON,
      e2eWatchdogDelayedNoSkipWaitMs(),
    );

    await expectE2eNowPlayingShowsPauseControl(page);
  });

  test("embed150 mock skips with embed-disabled copy (pairs with remount watchdog context spec)", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.embed150,
    );
    await startE2eAlbumOneTrackPlayback(page);

    await expectPlaybackSkipReasonVisible(page, E2E_EMBED_DISABLED_SKIP_REASON);
  });
});
