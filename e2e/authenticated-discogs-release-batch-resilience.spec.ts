import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { e2eTrackPlayButtonLabel } from "src/tests/msw/e2eReleaseDetailData";
import { createE2ePartialThenRemainderReleaseBatchHandler } from "src/tests/msw/e2eReleaseHandlers";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { E2E_TAG_DESKTOP_ONLY } from "./e2eProjectTags.constants";
import { test } from "./fixtures/msw.fixture";
import { waitForDiscogsReleaseBatchPosts } from "./helpers/discogsReleaseBatchResilience";
import {
  E2E_WATCHDOG_SKIP_REASON,
  e2eWatchdogNoSkipWaitMs,
  expectNoPlaybackSkipReason,
} from "./helpers/embedWatchdog";
import {
  closeReleaseModal,
  expectReleaseModalShowsE2eTracklist,
  openReleaseModalByTitle,
} from "./helpers/releaseModal";
import { gotoReleasesWorkspace } from "./helpers/releasesWorkspace";
import {
  enableE2eExtendQueueWithSimilarReleases,
  expectE2eNowPlayingShowsPauseControl,
  stubE2eCollectionWithSimilarTailPeers,
  stubE2eSimilarTailReleaseDetailsForPlayback,
} from "./helpers/similarQueuePlayback";

test.describe("authenticated Discogs release batch resilience (MSW)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("similar-tail playback refetches after a partial release batch map", {
    tag: E2E_TAG_DESKTOP_ONLY,
  }, async ({ page, network }) => {
    enableE2eExtendQueueWithSimilarReleases(network);
    stubE2eCollectionWithSimilarTailPeers(network);
    network.use(createE2ePartialThenRemainderReleaseBatchHandler());
    stubE2eSimilarTailReleaseDetailsForPlayback(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );

    const preferencesLoaded = page.waitForResponse(
      (response) =>
        response.url().includes("/api/user/preferences") && response.ok(),
    );

    const batchPosts = waitForDiscogsReleaseBatchPosts(page, 2);

    await gotoReleasesWorkspace(page);
    await preferencesLoaded;

    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);

    await page
      .getByRole("button", { name: e2eTrackPlayButtonLabel(E2E_ALBUM_ONE) })
      .click();
    await closeReleaseModal(page);

    await expectE2eNowPlayingShowsPauseControl(page);
    await batchPosts;

    await expectNoPlaybackSkipReason(
      page,
      E2E_WATCHDOG_SKIP_REASON,
      e2eWatchdogNoSkipWaitMs(),
    );
  });
});
