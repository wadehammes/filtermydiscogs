import { HttpResponse, http } from "msw";
import { buildE2eReleaseDetailByDiscogsId } from "src/tests/msw/e2eReleaseDetailData";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export function createDefaultReleaseApiHandlers() {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();

  return [
    http.post("/api/release/batch", async ({ request }) => {
      const body = (await request.json()) as { ids?: string[] };
      const ids = body.ids ?? [];
      const releases: Record<string, DiscogsReleaseDetail> = {};

      for (const releaseId of ids) {
        const detail = releaseDetails.get(releaseId);

        if (detail) {
          releases[releaseId] = detail;
        }
      }

      return HttpResponse.json({ releases });
    }),
    http.get("/api/release/:id", ({ params }) => {
      const releaseId = String(params.id);
      const detail = releaseDetails.get(releaseId);

      if (!detail) {
        return HttpResponse.json(
          { error: "Release not found" },
          { status: 404 },
        );
      }

      return HttpResponse.json(detail);
    }),
  ];
}
