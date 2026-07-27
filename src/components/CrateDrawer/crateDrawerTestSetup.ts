import type * as apiHelpers from "src/api/helpers";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";

export const crateDrawerPackedAt = "2026-07-27T00:00:00.000Z";

export const crateDrawerDefaultCrate = crateWithCountFactory.build({
  id: "crate-1",
  is_default: true,
  packed_enabled: true,
  releaseCount: 2,
});

export const {
  releaseCount: _defaultReleaseCount,
  ...crateDrawerDefaultDetail
} = crateDrawerDefaultCrate;

export const crateDrawerReleasePacked = releaseFactory.build({
  instance_id: "111",
});

export const crateDrawerReleaseUnpacked = releaseFactory.build({
  instance_id: "222",
});

export const crateDrawerPartiallyPackedResponse =
  crateWithReleasesResponseFactory.withReleaseItems(crateDrawerDefaultDetail, [
    { release: crateDrawerReleasePacked, found_at: crateDrawerPackedAt },
    { release: crateDrawerReleaseUnpacked, found_at: null },
  ]);

export const setupCrateDrawerTests = (
  mockApi: jest.Mocked<typeof apiHelpers>,
) => {
  jest.clearAllMocks();
  localStorage.clear();
  setupMockMatchMedia({ desktop: true });

  mockApiResponse(
    true,
    mockApi.fetchCrates,
    cratesResponseFactory.withCrates([crateDrawerDefaultCrate]),
    new Error("Crate API request failed"),
  );
};
