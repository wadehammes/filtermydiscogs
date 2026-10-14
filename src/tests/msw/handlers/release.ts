import { HttpResponse, http } from "msw";
import { buildE2eReleaseDetailByDiscogsId } from "src/tests/msw/e2eReleaseDetailData";
import { buildE2eReleaseBatchResponseBody } from "src/tests/msw/e2eReleaseHandlers";

export function createDefaultReleaseApiHandlers() {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();

  return [
    http.post("/api/release/batch", async ({ request }) => {
      const body = (await request.json()) as { ids?: string[] };
      const ids = body.ids ?? [];

      return HttpResponse.json(
        buildE2eReleaseBatchResponseBody(ids, releaseDetails),
      );
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
