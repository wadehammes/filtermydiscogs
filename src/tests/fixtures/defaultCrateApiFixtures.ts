import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import type { DiscogsRelease } from "src/types";
import type {
  CrateWithCount,
  CrateWithReleasesResponse,
  ReleaseCrateMembershipResponse,
} from "src/types/crate.types";

export function buildDefaultCrateApiFixtures(options?: {
  releases?: DiscogsRelease[];
}) {
  const defaultCrate = crateFactory.defaultTestCrate();
  const releases = options?.releases ?? [];
  const previewThumbs = releases
    .slice(0, 3)
    .map((release) => release.basic_information.thumb)
    .filter((thumb): thumb is string => Boolean(thumb));

  const defaultCrateWithCount: CrateWithCount =
    crateWithCountFactory.defaultTestCrate({
      releaseCount: releases.length,
      ...(previewThumbs.length > 0 ? { previewThumbs } : {}),
    });

  const crateDetail: CrateWithReleasesResponse =
    releases.length > 0
      ? crateWithReleasesResponseFactory.withReleases(defaultCrate, releases)
      : crateWithReleasesResponseFactory.empty(defaultCrate);

  const membership: ReleaseCrateMembershipResponse =
    releaseCrateMembershipResponseFactory.build();

  return {
    defaultCrate,
    defaultCrateWithCount,
    cratesListResponse: cratesResponseFactory.withCrate(defaultCrateWithCount),
    crateDetail,
    membership,
  };
}
