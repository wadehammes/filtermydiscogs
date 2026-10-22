import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { E2E_TAG_DESKTOP_ONLY } from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import {
  expectE2eNowPlayingShowsPauseControl,
  expectE2eNowPlayingShowsPlayControl,
  simulateE2eYoutubeChromePause,
} from "./helpers/embedTransportSync";
import {
  startE2eAlbumOneTrackPlayback,
  stubE2eReleaseDetailWithYoutubeVideoId,
} from "./helpers/embedWatchdog";
import {
  expectActivePlaylistTrackShowsPausedIndicator,
  openDesktopPlaylistDrawer,
  playE2ePlaylistFromDrawerFooter,
  selectE2ePlaylistInDrawer,
} from "./helpers/playlistDrawer";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated playback transport sync (MSW + mock iframe)", () => {
  test.describe.configure({ timeout: 60_000 });

  test("syncs mini player to paused when embed posts paused infoDelivery with progress", async ({
    page,
    network,
  }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    await startE2eAlbumOneTrackPlayback(page);
    await expectE2eNowPlayingShowsPauseControl(page);
    await simulateE2eYoutubeChromePause(page);
    await expectE2eNowPlayingShowsPlayControl(page);
  });

  test("syncs playlist drawer active row indicator when YouTube chrome pauses", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page, network }) => {
    await stubE2eReleaseDetailWithYoutubeVideoId(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );
    await gotoReleasesWorkspace(page);
    await openDesktopPlaylistDrawer(page);
    await selectE2ePlaylistInDrawer(page);
    await playE2ePlaylistFromDrawerFooter(page);
    await expectE2eNowPlayingShowsPauseControl(page);
    await simulateE2eYoutubeChromePause(page);
    await expectE2eNowPlayingShowsPlayControl(page);
    await expectActivePlaylistTrackShowsPausedIndicator(page);
  });
});
