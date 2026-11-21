import {
  E2E_TAG_DESKTOP_ONLY,
  E2E_TAG_FULL_SUITE,
} from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import { startE2eCollectionRadio } from "./helpers/collectionRadio";
import { expectE2eNowPlayingShowsPauseControl } from "./helpers/embedTransportSync";
import { startE2eAlbumOneTrackPlayback } from "./helpers/embedWatchdog";
import { expectE2ePlaybackDockElapsedTime } from "./helpers/playbackDockControls";

test.describe("authenticated collection radio playback (MSW + mock iframe)", () => {
  test.describe.configure({ timeout: 90_000 });

  test("after playing a release, starting collection radio advances the dock elapsed time", {
    tag: [E2E_TAG_DESKTOP_ONLY, E2E_TAG_FULL_SUITE],
  }, async ({ page }) => {
    await startE2eAlbumOneTrackPlayback(page);
    await expectE2eNowPlayingShowsPauseControl(page);

    await startE2eCollectionRadio(page);

    await expectE2eNowPlayingShowsPauseControl(page);
    await expectE2ePlaybackDockElapsedTime(page, "0:01");
  });
});
