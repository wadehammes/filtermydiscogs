import { HttpResponse, http } from "msw";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import type { DiscogsRelease } from "src/types";

export function createDefaultCrateApiHandlers(options?: {
  releases?: DiscogsRelease[];
}) {
  const defaultCrate = crateFactory.defaultTestCrate();
  const releases = options?.releases ?? [];
  const previewThumbs = releases
    .slice(0, 3)
    .map((release) => release.basic_information.thumb)
    .filter((thumb): thumb is string => Boolean(thumb));

  const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate({
    releaseCount: releases.length,
    ...(previewThumbs.length > 0 ? { previewThumbs } : {}),
  });

  const defaultCrateDetail =
    releases.length > 0
      ? crateWithReleasesResponseFactory.withReleases(defaultCrate, releases)
      : crateWithReleasesResponseFactory.empty(defaultCrate);

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
    http.get("/api/crates/:crateId", ({ params }) => {
      const crateId = String(params.crateId);

      if (crateId === defaultCrate.id) {
        return HttpResponse.json(defaultCrateDetail);
      }

      return HttpResponse.json(
        crateWithReleasesResponseFactory.empty(
          crateFactory.build({ id: crateId }),
        ),
      );
    }),
    http.get("/api/crates/membership/:instanceId", () =>
      HttpResponse.json(releaseCrateMembershipResponseFactory.build()),
    ),
  ];
}
