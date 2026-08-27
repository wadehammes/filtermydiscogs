import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
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
  notes: null,
  packed_enabled: true,
  private: true,
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
    {
      release: crateDrawerReleasePacked,
      found_at: crateDrawerPackedAt,
      sort_order: 1000,
    },
    {
      release: crateDrawerReleaseUnpacked,
      found_at: null,
      sort_order: 2000,
    },
  ]);

export const setupCrateDrawerTests = (
  mockApi: jest.Mocked<Api> = jest.mocked(api),
) => {
  jest.clearAllMocks();
  localStorage.clear();
  setupMockMatchMedia({ desktop: true });

  mockApiResponse(
    true,
    mockApi.crates,
    cratesResponseFactory.withCrates([crateDrawerDefaultCrate]),
    new Error("Crate API request failed"),
  );

  mockApiResponse(
    true,
    mockApi.crate,
    crateWithReleasesResponseFactory.withReleases(crateDrawerDefaultDetail, []),
    new Error("Crate API request failed"),
  );
};
