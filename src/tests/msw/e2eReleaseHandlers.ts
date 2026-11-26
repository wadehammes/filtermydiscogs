import type { RequestHandler } from "msw";
import { delay, HttpResponse, http } from "msw";
import {
  buildE2eReleaseDetailByDiscogsId,
  buildE2eReleaseDetailMapWithSimilarModalPeers,
  buildE2eReleaseDetailWithYoutubeVideoId,
} from "src/tests/msw/e2eReleaseDetailData";
import {
  E2E_ALBUM_ONE,
  E2E_DISCOGS_RELEASE_ID_ONE,
} from "src/tests/msw/e2eSession.constants";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export type E2eReleaseByIdHandlerOptions = {
  albumOneYoutubeVideoId?: string;
  notFoundReleaseIds?: ReadonlySet<string>;
  withSimilarModalPeers?: boolean;
};

const buildE2eReleaseDetailsMap = (options: E2eReleaseByIdHandlerOptions) =>
  options.withSimilarModalPeers
    ? buildE2eReleaseDetailMapWithSimilarModalPeers()
    : buildE2eReleaseDetailByDiscogsId();

export const buildE2eReleaseBatchResponseBody = (
  ids: string[],
  releaseDetails: ReadonlyMap<string, DiscogsReleaseDetail>,
): { releases: Record<string, DiscogsReleaseDetail> } => {
  const releases: Record<string, DiscogsReleaseDetail> = {};

  for (const releaseId of ids) {
    const detail = releaseDetails.get(releaseId);

    if (detail) {
      releases[releaseId] = detail;
    }
  }

  return { releases };
};

const buildE2eReleaseByIdResponse = (
  releaseId: string,
  options: E2eReleaseByIdHandlerOptions,
  releaseDetails: ReadonlyMap<string, DiscogsReleaseDetail>,
  notFoundReleaseIds: ReadonlySet<string>,
) => {
  if (notFoundReleaseIds.has(releaseId)) {
    return HttpResponse.json({ error: "Release not found" }, { status: 404 });
  }

  if (
    releaseId === String(E2E_DISCOGS_RELEASE_ID_ONE) &&
    options.albumOneYoutubeVideoId
  ) {
    return HttpResponse.json(
      buildE2eReleaseDetailWithYoutubeVideoId(
        E2E_DISCOGS_RELEASE_ID_ONE,
        E2E_ALBUM_ONE,
        options.albumOneYoutubeVideoId,
      ),
    );
  }

  const detail = releaseDetails.get(releaseId);

  if (!detail) {
    return HttpResponse.json({ error: "Release not found" }, { status: 404 });
  }

  return HttpResponse.json(detail);
};

export const createE2eReleaseByIdHandler = (
  options: E2eReleaseByIdHandlerOptions = {},
): RequestHandler => {
  const releaseDetails = buildE2eReleaseDetailsMap(options);
  const notFoundReleaseIds = options.notFoundReleaseIds ?? new Set<string>();

  return http.get("/api/release/:id", ({ params }) => {
    const releaseId = String(params.id);

    return buildE2eReleaseByIdResponse(
      releaseId,
      options,
      releaseDetails,
      notFoundReleaseIds,
    );
  });
};

export type E2eDelayedReleaseByIdOptions = E2eReleaseByIdHandlerOptions & {
  delayMs: number;
  delayedReleaseIds: ReadonlySet<string>;
};

export const createE2eDelayedReleaseByIdHandler = (
  options: E2eDelayedReleaseByIdOptions,
): RequestHandler => {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();
  const notFoundReleaseIds = options.notFoundReleaseIds ?? new Set<string>();
  const { delayMs, delayedReleaseIds } = options;

  return http.get("/api/release/:id", async ({ params }) => {
    const releaseId = String(params.id);

    if (delayedReleaseIds.has(releaseId)) {
      await delay(delayMs);
    }

    return buildE2eReleaseByIdResponse(
      releaseId,
      options,
      releaseDetails,
      notFoundReleaseIds,
    );
  });
};

export const createE2eDelayedReleaseBatchHandler = (
  delayMs: number,
): RequestHandler => {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();

  return http.post("/api/release/batch", async ({ request }) => {
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids ?? [];

    await delay(delayMs);

    return HttpResponse.json(
      buildE2eReleaseBatchResponseBody(ids, releaseDetails),
    );
  });
};

export const createE2eTransient503ThenOkReleaseBatchHandler = (
  retryAfterSeconds = 0,
): RequestHandler => {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();
  let postCount = 0;

  return http.post("/api/release/batch", async ({ request }) => {
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids ?? [];

    postCount += 1;

    if (postCount === 1) {
      return HttpResponse.json(
        { error: "Discogs throttle queue timeout" },
        {
          status: 503,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        },
      );
    }

    return HttpResponse.json(
      buildE2eReleaseBatchResponseBody(ids, releaseDetails),
    );
  });
};

export const createE2ePartialThenRemainderReleaseBatchHandler =
  (): RequestHandler => {
    const releaseDetails = buildE2eReleaseDetailByDiscogsId();

    return http.post("/api/release/batch", async ({ request }) => {
      const body = (await request.json()) as { ids?: string[] };
      const ids = body.ids ?? [];

      if (ids.length > 1) {
        const firstId = ids[0];

        if (firstId === undefined) {
          return HttpResponse.json({ releases: {} });
        }

        const detail = releaseDetails.get(firstId);
        const releases: Record<string, DiscogsReleaseDetail> = {};

        if (detail) {
          releases[firstId] = detail;
        }

        return HttpResponse.json({ releases });
      }

      return HttpResponse.json(
        buildE2eReleaseBatchResponseBody(ids, releaseDetails),
      );
    });
  };
