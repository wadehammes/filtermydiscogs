import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";

const defaultCrateApiError = new Error("Crate API request failed");

export function setupDefaultCrateApiMocks(
  mockApi: jest.Mocked<Api> = jest.mocked(api),
) {
  const defaultCrate = crateFactory.defaultTestCrate();
  const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

  mockApiResponse(
    true,
    mockApi.crates,
    cratesResponseFactory.withCrate(defaultCrateWithCount),
    defaultCrateApiError,
  );

  mockApiResponse(
    true,
    mockApi.crate,
    crateWithReleasesResponseFactory.empty(defaultCrate),
    defaultCrateApiError,
  );

  if (jest.isMockFunction(mockApi.releaseCrateMembership)) {
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      defaultCrateApiError,
    );
  }

  if (jest.isMockFunction(mockApi.discogsRelease)) {
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
  }
}
