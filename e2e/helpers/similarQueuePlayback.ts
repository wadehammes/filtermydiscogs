import type { NetworkFixture } from "@msw/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { delay, HttpResponse, http } from "msw";
import { NOW_PLAYING_REGION_LABEL } from "src/constants/accessibilityLabels.constants";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { buildE2eCollectionReleases } from "src/tests/msw/e2eCollectionData";
import {
  buildE2eReleaseDetailByDiscogsId,
  buildE2eReleaseDetailWithYoutubeVideoId,
} from "src/tests/msw/e2eReleaseDetailData";
import {
  E2E_ALBUM_ONE,
  E2E_DISCOGS_RELEASE_ID_ONE,
  E2E_DISCOGS_RELEASE_ID_THREE,
  E2E_DISCOGS_RELEASE_ID_TWO,
} from "src/tests/msw/e2eSession.constants";
import type { DiscogsRelease } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

const E2E_SIMILAR_TAIL_PEER_RELEASE_IDS = new Set([
  String(E2E_DISCOGS_RELEASE_ID_TWO),
  String(E2E_DISCOGS_RELEASE_ID_THREE),
]);

const buildE2eSimilarTailCollectionReleases = (): DiscogsRelease[] =>
  buildE2eCollectionReleases().map((release) => {
    if (release.basic_information.id === E2E_DISCOGS_RELEASE_ID_ONE) {
      return release;
    }

    return {
      ...release,
      basic_information: {
        ...release.basic_information,
        genres: ["Rock"],
        styles: ["Indie Rock"],
      },
    };
  });

export const stubE2eCollectionWithSimilarTailPeers = (
  network: NetworkFixture,
) => {
  const releases = buildE2eSimilarTailCollectionReleases();

  return network.use(
    http.get("/api/collection", ({ request }) => {
      const url = new URL(request.url);
      const perPage = Number.parseInt(
        url.searchParams.get("per_page") ?? "100",
        10,
      );
      const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);

      return HttpResponse.json(
        collectionFactory.forReleasesPage(releases, { page, perPage }),
      );
    }),
  );
};

export const enableE2eExtendQueueWithSimilarReleases = (
  network: NetworkFixture,
) =>
  network.use(
    http.get("/api/user/preferences", () =>
      HttpResponse.json({
        preferences: userPreferencesFactory.build({
          extendQueueWithSimilarReleases: true,
        }),
      }),
    ),
  );

export const stubE2eSimilarTailReleaseDetailsForPlayback = (
  network: NetworkFixture,
  albumOneYoutubeVideoId: string,
) => {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();

  return network.use(
    http.get("/api/release/:id", ({ params }) => {
      const releaseId = String(params.id);

      if (E2E_SIMILAR_TAIL_PEER_RELEASE_IDS.has(releaseId)) {
        return HttpResponse.json(
          { error: "Release not found" },
          { status: 404 },
        );
      }

      if (releaseId === String(E2E_DISCOGS_RELEASE_ID_ONE)) {
        return HttpResponse.json(
          buildE2eReleaseDetailWithYoutubeVideoId(
            E2E_DISCOGS_RELEASE_ID_ONE,
            E2E_ALBUM_ONE,
            albumOneYoutubeVideoId,
          ),
        );
      }

      const detail = releaseDetails.get(releaseId);

      if (!detail) {
        return HttpResponse.json(
          { error: "Release not found" },
          { status: 404 },
        );
      }

      return HttpResponse.json(detail);
    }),
  );
};

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
) => {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();

  return network.use(
    http.post("/api/release/batch", async ({ request }) => {
      const body = (await request.json()) as { ids?: string[] };
      const ids = body.ids ?? [];

      await delay(delayMs);

      const releases: Record<string, DiscogsReleaseDetail> = {};

      for (const releaseId of ids) {
        const detail = releaseDetails.get(releaseId);

        if (detail) {
          releases[releaseId] = detail;
        }
      }

      return HttpResponse.json({ releases });
    }),
  );
};
