import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { buildDefaultCrateApiFixtures } from "src/tests/fixtures/defaultCrateApiFixtures";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultTrackStatsApiMock } from "src/tests/mocks/setupDefaultTrackStatsApiMock";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";

const defaultCrateApiError = new Error("Crate API request failed");

export function setupDefaultCrateApiMocks(
  mockApi: jest.Mocked<Api> = jest.mocked(api),
) {
  const { cratesListResponse, crateDetail, membership } =
    buildDefaultCrateApiFixtures();

  mockApiResponse(
    true,
    mockApi.crates,
    cratesListResponse,
    defaultCrateApiError,
  );

  mockApiResponse(true, mockApi.crate, crateDetail, defaultCrateApiError);

  if (jest.isMockFunction(mockApi.releaseCrateMembership)) {
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      membership,
      defaultCrateApiError,
    );
  }

  if (jest.isMockFunction(mockApi.discogsRelease)) {
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
  }

  setupDefaultTrackStatsApiMock(mockApi);
}
