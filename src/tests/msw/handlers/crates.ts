import { randomUUID } from "node:crypto";
import { HttpResponse, http } from "msw";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { buildDefaultCrateApiFixtures } from "src/tests/fixtures/defaultCrateApiFixtures";
import type { DiscogsRelease } from "src/types";
import type { CrateWithCount } from "src/types/crate.types";

export function createDefaultCrateApiHandlers(options?: {
  releases?: DiscogsRelease[];
}) {
  const fixtures = buildDefaultCrateApiFixtures(options);
  const { defaultCrate, defaultCrateWithCount, crateDetail } = fixtures;
  const collectionReleases = options?.releases ?? [];
  const crates: CrateWithCount[] = [defaultCrateWithCount];

  const buildCratesListResponse = () =>
    cratesResponseFactory.withCrates([...crates]);
  const membershipByInstance = new Map<string, string[]>();

  for (const release of collectionReleases) {
    membershipByInstance.set(String(release.instance_id), [
      ...fixtures.membership.crateIds,
    ]);
  }

  const membershipResponse = (instanceId: string) => ({
    crateIds: membershipByInstance.get(instanceId) ?? [],
  });

  return [
    http.get("/api/crates", ({ request }) => {
      const url = new URL(request.url);
      const list = buildCratesListResponse();

      if (url.searchParams.get("all") === "true") {
        return HttpResponse.json({
          data: list.crates,
          pagination: {
            page: 1,
            pageSize: 100,
            total: list.crates.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      return HttpResponse.json(list);
    }),
    http.post("/api/crates", async ({ request }) => {
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim() ?? "";

      if (!name) {
        return HttpResponse.json(
          { error: "Crate name is required" },
          {
            status: 400,
          },
        );
      }

      const duplicate = crates.some((crate) => crate.name === name);
      if (duplicate) {
        return HttpResponse.json(
          { error: "A crate with this name already exists" },
          { status: 409 },
        );
      }

      const newCrate = crateFactory.build({
        id: randomUUID(),
        name,
        is_default: false,
        user_id: defaultCrate.user_id,
      });
      const crateWithCount = crateWithCountFactory.fromCrate(newCrate, {
        releaseCount: 0,
      });

      crates.push(crateWithCount);

      return HttpResponse.json({ crate: newCrate }, { status: 201 });
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
    http.get("/api/crates/membership/:instanceId", ({ params }) =>
      HttpResponse.json(membershipResponse(String(params.instanceId))),
    ),
    http.put(
      "/api/crates/membership/:instanceId",
      async ({ params, request }) => {
        const instanceId = String(params.instanceId);
        const body = (await request.json()) as { crateIds?: string[] };
        const crateIds = body.crateIds ?? [];

        membershipByInstance.set(instanceId, [...crateIds]);

        return HttpResponse.json({ success: true, crateIds });
      },
    ),
    http.post("/api/crates/:crateId/releases", async ({ params, request }) => {
      const crateId = String(params.crateId);
      const release = (await request.json()) as DiscogsRelease;
      const instanceId = String(release.instance_id);
      const crateIds = new Set(membershipByInstance.get(instanceId) ?? []);

      crateIds.add(crateId);
      membershipByInstance.set(instanceId, [...crateIds]);

      return HttpResponse.json({ success: true });
    }),
    http.delete("/api/crates/:crateId/releases/:releaseId", ({ params }) => {
      const crateId = String(params.crateId);
      const releaseId = String(params.releaseId);
      const crateIds = new Set(membershipByInstance.get(releaseId) ?? []);

      crateIds.delete(crateId);
      membershipByInstance.set(releaseId, [...crateIds]);

      return HttpResponse.json({ success: true });
    }),
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
