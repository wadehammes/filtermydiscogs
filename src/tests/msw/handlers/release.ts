import { HttpResponse, http } from "msw";
import { buildE2eReleaseDetailByDiscogsId } from "src/tests/msw/e2eReleaseDetailData";

export function createDefaultReleaseApiHandlers() {
  const releaseDetails = buildE2eReleaseDetailByDiscogsId();

  return [
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
