import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import {
  E2E_EMBED_MOCK_DELAYED_PLAYING_MS,
  E2E_EMBED_MOCK_VIDEO_IDS,
} from "src/constants/e2eEmbedMock.constants";
import { isE2eSmokeSuite } from "./e2eSuite.constants";
import { expect, test } from "./fixtures/msw.fixture";
import {
  E2E_WATCHDOG_SKIP_REASON,
  E2E_YOUTUBE_ERROR_SKIP_REASON,
  e2eWatchdogDelayedNoSkipWaitMs,
  e2eWatchdogMinDelayBeforePlayingMs,
  e2eWatchdogNoSkipWaitMs,
  expectE2ePersistentEmbedSrcMatches,
  expectNoPlaybackSkipReason,
  expectPlaybackSkipReasonVisible,
  startE2eAlbumOneTrackPlayback,
  stubE2eReleaseDetailWithYoutubeVideoId,
} from "./helpers/embedWatchdog";

test.describe("authenticated embed watchdog harness (MSW + mock iframe)", () => {
  test.describe.configure({ timeout: 90_000 });
  test("normal mock confirms playback without watchdog skip", async ({
    page,
    network,
  }) => {
    test.skip(isE2eSmokeSuite(), "long watchdog settle window — full E2E only");

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

  test("delayed mock confirms after watchdog window when delay exceeds threshold", async ({
    page,
    network,
  }) => {
    test.skip(isE2eSmokeSuite(), "long watchdog timing — full E2E only");
    test.skip(
      E2E_EMBED_MOCK_DELAYED_PLAYING_MS <= e2eWatchdogMinDelayBeforePlayingMs(),
      "delayed harness delay must exceed the fastest embed watchdog fire time",
    );

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
  });
});
