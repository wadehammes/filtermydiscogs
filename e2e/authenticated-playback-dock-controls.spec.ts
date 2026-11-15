import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { PLAYBACK_DOCK_SEEK_SKIP_SECONDS } from "src/utils/playbackEmbedProgress";
import { E2E_TAG_DESKTOP_ONLY } from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import { expectE2eNowPlayingShowsPauseControl } from "./helpers/embedTransportSync";
import {
  startE2eAlbumOneTrackPlayback,
  stubE2eReleaseDetailWithYoutubeVideoId,
} from "./helpers/embedWatchdog";
import {
  commitE2ePlaybackDockLowVolume,
  expectE2ePlaybackDockDigControlsVisible,
  expectE2ePlaybackDockElapsedTime,
  expectE2ePlaybackDockVolumePersistedBelowDefault,
  openE2ePlaybackVolumePopover,
  skipE2ePlaybackDockForward,
} from "./helpers/playbackDockControls";

test.describe("authenticated playback dock controls (MSW + mock iframe)", () => {
  test.describe.configure({ timeout: 60_000 });

  test("shows scrub and volume controls when embed playback is ready", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    await startE2eAlbumOneTrackPlayback(page);
    await expectE2eNowPlayingShowsPauseControl(page);
    await expectE2ePlaybackDockDigControlsVisible(page);
  });

  test("±10s skip updates the dock elapsed time", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page, network }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    await startE2eAlbumOneTrackPlayback(page);
    await expectE2eNowPlayingShowsPauseControl(page);
    await expectE2ePlaybackDockElapsedTime(page, "0:01");

    await skipE2ePlaybackDockForward(page);

    const expectedSeconds = 1 + PLAYBACK_DOCK_SEEK_SKIP_SECONDS;
    const expectedMinutes = Math.floor(expectedSeconds / 60);
    const expectedRemainder = expectedSeconds % 60;
    const expectedLabel = `${expectedMinutes}:${expectedRemainder.toString().padStart(2, "0")}`;

    await expectE2ePlaybackDockElapsedTime(page, expectedLabel);
  });

  test("volume slider commit persists dock level in localStorage", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    await startE2eAlbumOneTrackPlayback(page);
    await expectE2eNowPlayingShowsPauseControl(page);
    await openE2ePlaybackVolumePopover(page);

    await commitE2ePlaybackDockLowVolume(page);

    await expectE2ePlaybackDockVolumePersistedBelowDefault(page);
  });
});
