import { HttpResponse, http } from "msw";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { buildDefaultCrateApiFixtures } from "src/tests/fixtures/defaultCrateApiFixtures";
import type { DiscogsRelease } from "src/types";

export function createDefaultCrateApiHandlers(options?: {
  releases?: DiscogsRelease[];
}) {
  const fixtures = buildDefaultCrateApiFixtures(options);
  const { defaultCrate, crateDetail, cratesListResponse } = fixtures;

  return [
    http.get("/api/crates", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("all") === "true") {
        return HttpResponse.json({
          data: cratesListResponse.crates,
          pagination: {
            page: 1,
            pageSize: 100,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      return HttpResponse.json(cratesListResponse);
    }),
    http.get("/api/crates/:crateId", ({ params }) => {
      const crateId = String(params.crateId);

      if (crateId === defaultCrate.id) {
        return HttpResponse.json(crateDetail);
      }

      return HttpResponse.json(
        crateWithReleasesResponseFactory.empty(
          crateFactory.build({ id: crateId }),
        ),
      );
    }),
    http.get("/api/crates/membership/:instanceId", () =>
      HttpResponse.json(fixtures.membership),
    ),
    http.put("/api/crates/:crateId/layout", async ({ params, request }) => {
      const crateId = String(params.crateId);

      if (crateId !== defaultCrate.id) {
        return HttpResponse.json({ error: "Crate not found" }, { status: 404 });
      }

      await request.json().catch(() => null);

      return HttpResponse.json({
        success: true,
        releases: crateDetail.releases,
        markers: crateDetail.markers,
      });
    }),
  ];
}
