import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { E2E_EMBED_MOCK_VIDEO_IDS } from "src/constants/e2eEmbedMock.constants";
import { e2eTrackPlayButtonLabel } from "src/tests/msw/e2eReleaseDetailData";
import { E2E_ALBUM_ONE } from "src/tests/msw/e2eSession.constants";
import { isE2eSmokeSuite } from "./e2eSuite.constants";
import { expect, test } from "./fixtures/msw.fixture";
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
  expectE2eSimilarQueueBuildingThenIdle,
  startWaitingForE2eSimilarTailBatchPost,
  stubE2eCollectionWithSimilarTailPeers,
  stubE2eDelayedDiscogsReleaseBatch,
  stubE2eSimilarTailReleaseDetailsForPlayback,
} from "./helpers/similarQueuePlayback";

const E2E_SIMILAR_TAIL_BATCH_DELAY_MS = 4_000;

test.describe("authenticated similar queue tail (MSW)", () => {
  test.describe.configure({ timeout: 120_000 });

  test("does not watchdog-skip confirmed playback while similar tail batch is loading", {
    tag: "@desktop-only",
  }, async ({ page, network }) => {
    test.skip(isE2eSmokeSuite(), "long watchdog settle window — full E2E only");

    enableE2eExtendQueueWithSimilarReleases(network);
    stubE2eCollectionWithSimilarTailPeers(network);
    stubE2eDelayedDiscogsReleaseBatch(network, E2E_SIMILAR_TAIL_BATCH_DELAY_MS);
    stubE2eSimilarTailReleaseDetailsForPlayback(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );

    const preferencesLoaded = page.waitForResponse(
      (response) =>
        response.url().includes("/api/user/preferences") && response.ok(),
    );

    await gotoReleasesWorkspace(page);
    await preferencesLoaded;

    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);

    const similarBatchPosted = startWaitingForE2eSimilarTailBatchPost(page);

    await page
      .getByRole("button", { name: e2eTrackPlayButtonLabel(E2E_ALBUM_ONE) })
      .click();
    await closeReleaseModal(page);

    await expect(
      page.getByRole("region", { name: NOW_PLAYING_REGION_LABEL }),
    ).toBeVisible({ timeout: 15_000 });

    await similarBatchPosted;

    const queueButton = page.getByRole("button", {
      name: /Open playback queue/i,
    });
    await queueButton.scrollIntoViewIfNeeded();
    await queueButton.click();

    await expectNoPlaybackSkipReason(
      page,
      E2E_WATCHDOG_SKIP_REASON,
      e2eWatchdogNoSkipWaitMs(),
    );
  });

  test("does not watchdog-skip after mock embed confirms before similar batch response returns", {
    tag: "@desktop-only",
  }, async ({ page, network }) => {
    test.skip(isE2eSmokeSuite(), "long watchdog settle window — full E2E only");

    enableE2eExtendQueueWithSimilarReleases(network);
    stubE2eCollectionWithSimilarTailPeers(network);
    stubE2eDelayedDiscogsReleaseBatch(network, E2E_SIMILAR_TAIL_BATCH_DELAY_MS);
    stubE2eSimilarTailReleaseDetailsForPlayback(
      network,
      E2E_EMBED_MOCK_VIDEO_IDS.normal,
    );

    const preferencesLoaded = page.waitForResponse(
      (response) =>
        response.url().includes("/api/user/preferences") && response.ok(),
    );

    await gotoReleasesWorkspace(page);
    await preferencesLoaded;

    await openReleaseModalByTitle(page, E2E_ALBUM_ONE);
    await expectReleaseModalShowsE2eTracklist(page, E2E_ALBUM_ONE);

    await page
      .getByRole("button", { name: e2eTrackPlayButtonLabel(E2E_ALBUM_ONE) })
      .click();
    await closeReleaseModal(page);

    await expectE2eNowPlayingShowsPauseControl(page);

    await expectE2eSimilarQueueBuildingThenIdle(
      page,
      E2E_SIMILAR_TAIL_BATCH_DELAY_MS,
    );

    await expectNoPlaybackSkipReason(
      page,
      E2E_WATCHDOG_SKIP_REASON,
      e2eWatchdogNoSkipWaitMs(),
    );
  });
});
