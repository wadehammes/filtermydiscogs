import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const setupFetchDiscogsReleaseMock = (
  mockApi: jest.Mocked<Api> = jest.mocked(api),
  defaultReleaseDetail: DiscogsReleaseDetail,
  releaseDetailsById: Record<string, DiscogsReleaseDetail> = {},
) => {
  mockApi.discogsRelease.mockImplementation(async (releaseId) => {
    const detail = releaseDetailsById[releaseId] ?? defaultReleaseDetail;

    return {
      ...detail,
      id: Number(releaseId) || detail.id,
    };
  });
};
