import type * as apiHelpers from "src/api/helpers";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const setupFetchDiscogsReleaseMock = (
  mockApi: jest.Mocked<typeof apiHelpers>,
  defaultReleaseDetail: DiscogsReleaseDetail,
  releaseDetailsById: Record<string, DiscogsReleaseDetail> = {},
) => {
  mockApi.fetchDiscogsRelease.mockImplementation(async (releaseId) => {
    const detail = releaseDetailsById[releaseId] ?? defaultReleaseDetail;

    return {
      ...detail,
      id: Number(releaseId) || detail.id,
    };
  });
};
