import type { NetworkFixture } from "@msw/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { HttpResponse, http } from "msw";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { buildE2eSimilarTailCollectionReleases } from "src/tests/msw/e2eCollectionData";
import { createE2eCollectionPageHandler } from "src/tests/msw/e2eCollectionHandlers";
import {
  createE2eDelayedReleaseBatchHandler,
  createE2eReleaseByIdHandler,
} from "src/tests/msw/e2eReleaseHandlers";
import {
  E2E_DISCOGS_RELEASE_ID_THREE,
  E2E_DISCOGS_RELEASE_ID_TWO,
} from "src/tests/msw/e2eSession.constants";

const E2E_SIMILAR_TAIL_PEER_RELEASE_IDS = new Set([
  String(E2E_DISCOGS_RELEASE_ID_TWO),
  String(E2E_DISCOGS_RELEASE_ID_THREE),
]);

export const stubE2eCollectionWithSimilarTailPeers = (
  network: NetworkFixture,
) => {
  const releases = buildE2eSimilarTailCollectionReleases();

  return network.use(createE2eCollectionPageHandler(releases));
};

export const enableE2eExtendQueueWithSimilarReleases = (
  network: NetworkFixture,
) =>
  network.use(
    http.get("/api/user/preferences", () =>
      HttpResponse.json(
        userPreferencesFactory.extendSimilarQueueDefaultsApiResponse(),
      ),
    ),
  );

export const stubE2eSimilarTailReleaseDetailsForPlayback = (
  network: NetworkFixture,
  albumOneYoutubeVideoId: string,
) =>
  network.use(
    createE2eReleaseByIdHandler({
      albumOneYoutubeVideoId,
      notFoundReleaseIds: E2E_SIMILAR_TAIL_PEER_RELEASE_IDS,
    }),
  );

const isE2eDiscogsReleaseBatchPost = (url: string, method: string) =>
  url.includes("/api/release/batch") && method === "POST";

export const startWaitingForE2eSimilarTailBatchPost = (page: Page) =>
  page.waitForRequest(
    (request) => isE2eDiscogsReleaseBatchPost(request.url(), request.method()),
    { timeout: 45_000 },
  );

export const expectE2eSimilarQueueBuildingThenIdle = async (
  page: Page,
  batchDelayMs: number,
) => {
  const buildingQueueButton = page.getByRole("button", {
    name: /Open playback queue, building/i,
  });

  await expect(buildingQueueButton).toBeVisible({ timeout: 20_000 });
  await expect(buildingQueueButton).toHaveCount(0, {
    timeout: batchDelayMs + 15_000,
  });
};

export const expectE2eNowPlayingShowsPauseControl = async (page: Page) => {
  const nowPlaying = page.getByRole("region", {
    name: NOW_PLAYING_REGION_LABEL,
  });

  await expect(nowPlaying).toBeVisible({ timeout: 15_000 });
  await expect(nowPlaying.getByRole("button", { name: "Pause" })).toBeVisible({
    timeout: 15_000,
  });
};

export const stubE2eDelayedDiscogsReleaseBatch = (
  network: NetworkFixture,
  delayMs: number,
) => network.use(createE2eDelayedReleaseBatchHandler(delayMs));
