import type { Api } from "src/api/urls";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

const apiError = new Error("API request failed");

export type SetupReleaseOpenPrefetchApiMocksOptions = {
  releaseId?: number;
  releaseDetail?: DiscogsReleaseDetail;
};

export const setupReleaseOpenPrefetchApiMocks = (
  mockApi: jest.Mocked<Api>,
  options: SetupReleaseOpenPrefetchApiMocksOptions = {},
): DiscogsReleaseDetail => {
  const releaseId = options.releaseId ?? 249504;
  const releaseDetail =
    options.releaseDetail ??
    discogsReleaseJsonFactory.withTracklistAndVideos({ id: releaseId });

  setupDefaultCrateApiMocks(mockApi);
  mockApiResponse(true, mockApi.discogsRelease, releaseDetail, apiError);

  return releaseDetail;
};
