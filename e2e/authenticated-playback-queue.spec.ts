import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { E2E_TAG_DESKTOP_ONLY } from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import {
  clickAddAlbumToQueue,
  e2eQueueTrackThree,
  e2eQueueTrackTwo,
  expectPlaybackQueueHasTwoTracks,
  expectQueueTrackOrder,
  openPlaybackQueueDrawer,
} from "./helpers/playbackQueue";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";

test.describe("authenticated playback queue drawer (MSW)", () => {
  test("lists upcoming queue tracks in add order in the drawer", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await gotoReleasesWorkspace(page);
    await clickAddAlbumToQueue(page, E2E_ALBUM_ONE);
    await clickAddAlbumToQueue(page, E2E_ALBUM_TWO);
    await clickAddAlbumToQueue(page, E2E_ALBUM_THREE);
    await expectPlaybackQueueHasTwoTracks(page);
    await openPlaybackQueueDrawer(page);

    await expectQueueTrackOrder(page, [
      e2eQueueTrackTwo(),
      e2eQueueTrackThree(),
    ]);
  });
});
