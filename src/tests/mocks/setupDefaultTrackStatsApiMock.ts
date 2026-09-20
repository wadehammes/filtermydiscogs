import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import { userTrackStatsResponseFactory } from "src/tests/factories/UserTrackStatsResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";

const defaultTrackStatsApiError = new Error("Track stats API request failed");

export function setupDefaultTrackStatsApiMock(
  mockApi: jest.Mocked<Api> = jest.mocked(api),
) {
  if (!jest.isMockFunction(mockApi.fetchTrackStats)) {
    return;
  }

  mockApiResponse(
    true,
    mockApi.fetchTrackStats,
    userTrackStatsResponseFactory.build(),
    defaultTrackStatsApiError,
  );
}
