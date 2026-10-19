import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import {
  E2E_ALBUM_ONE,
  E2E_ALBUM_THREE,
  E2E_ALBUM_TWO,
} from "src/tests/msw/e2eSession.constants";
import { E2E_TAG_DESKTOP_ONLY } from "./e2eProjectTags.constants";
import { isE2eSmokeSuite } from "./e2eSuite.constants";
import { test } from "./fixtures/msw.fixture";
import {
  E2E_WATCHDOG_SKIP_REASON,
  e2eWatchdogNoSkipWaitMs,
  expectNoPlaybackSkipReason,
} from "./helpers/embedWatchdog";
import {
  clickAddAlbumToQueue,
  e2eQueueTrackThree,
  e2eQueueTrackTwo,
  expectNowPlayingTrackTitle,
  expectPlaybackQueueHasTwoTracks,
  expectQueueTrackOrder,
  openPlaybackQueueDrawer,
  reorderQueueDrawerItem,
  startE2eAlbumTrackPlayback,
  stubE2eDelayedAlbumOneReleaseDetail,
} from "./helpers/playbackQueue";

test.describe("authenticated manual queue playback (MSW)", () => {
  test.describe.configure({ timeout: 90_000 });

  test("reorders the drawer queue without changing the active track", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page }) => {
    await startE2eAlbumTrackPlayback(page, E2E_ALBUM_ONE);
    await clickAddAlbumToQueue(page, E2E_ALBUM_TWO);
    await clickAddAlbumToQueue(page, E2E_ALBUM_THREE);
    await expectPlaybackQueueHasTwoTracks(page);
    await openPlaybackQueueDrawer(page);

    await expectQueueTrackOrder(page, [
      e2eQueueTrackTwo(),
      e2eQueueTrackThree(),
    ]);

    await reorderQueueDrawerItem(
      page,
      e2eQueueTrackThree(),
      e2eQueueTrackTwo(),
    );

    await expectQueueTrackOrder(page, [
      e2eQueueTrackThree(),
      e2eQueueTrackTwo(),
    ]);
    await expectNowPlayingTrackTitle(page, E2E_ALBUM_ONE);
  });

  test("after manual curation with slow album-one release detail, keeps the active track and does not watchdog-skip", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page, network }) => {
    test.skip(isE2eSmokeSuite(), "long watchdog settle window — full E2E only");

    stubE2eDelayedAlbumOneReleaseDetail(
      network,
      2_500,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );

    await startE2eAlbumTrackPlayback(page, E2E_ALBUM_ONE);
    await clickAddAlbumToQueue(page, E2E_ALBUM_TWO);
    await clickAddAlbumToQueue(page, E2E_ALBUM_THREE);
    await expectPlaybackQueueHasTwoTracks(page);
    await openPlaybackQueueDrawer(page);

    await reorderQueueDrawerItem(
      page,
      e2eQueueTrackThree(),
      e2eQueueTrackTwo(),
    );

    await expectQueueTrackOrder(page, [
      e2eQueueTrackThree(),
      e2eQueueTrackTwo(),
    ]);
    await expectNowPlayingTrackTitle(page, E2E_ALBUM_ONE);

    await expectNoPlaybackSkipReason(
      page,
      E2E_WATCHDOG_SKIP_REASON,
      e2eWatchdogNoSkipWaitMs(),
    );
    await expectNowPlayingTrackTitle(page, E2E_ALBUM_ONE);
  });
});
