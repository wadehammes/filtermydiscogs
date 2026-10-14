import type { RequestHandler } from "msw";
import { delay, HttpResponse, http } from "msw";
import {
  buildE2eReleaseDetailByDiscogsId,
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
};

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

export const createE2eReleaseByIdHandler = (
  options: E2eReleaseByIdHandlerOptions = {},
): RequestHandler => {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();
  const notFoundReleaseIds = options.notFoundReleaseIds ?? new Set<string>();

  return http.get("/api/release/:id", ({ params }) => {
    const releaseId = String(params.id);

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
