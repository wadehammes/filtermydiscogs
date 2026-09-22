import { HttpResponse, http } from "msw";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";

export function createDefaultCrateApiHandlers() {
  const defaultCrate = crateFactory.defaultTestCrate();
  const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

  return [
    http.get("/api/crates", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("all") === "true") {
        return HttpResponse.json({
          data: cratesResponseFactory.withCrate(defaultCrateWithCount).crates,
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

      return HttpResponse.json(
        cratesResponseFactory.withCrate(defaultCrateWithCount),
      );
    }),
    http.get("/api/crates/:crateId", () =>
      HttpResponse.json(crateWithReleasesResponseFactory.empty(defaultCrate)),
    ),
    http.get("/api/crates/membership/:instanceId", () =>
      HttpResponse.json(releaseCrateMembershipResponseFactory.build()),
    ),
  ];
}
