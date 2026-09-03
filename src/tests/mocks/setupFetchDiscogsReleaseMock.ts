import type { Api } from "src/api/urls";
import { api } from "src/api/urls";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const setupFetchDiscogsReleaseMock = (
  mockApi: jest.Mocked<Api> = jest.mocked(api),
  defaultReleaseDetail: DiscogsReleaseDetail,
  releaseDetailsById: Record<string, DiscogsReleaseDetail> = {},
) => {
  const resolveDetail = (releaseId: string): DiscogsReleaseDetail => {
    const detail = releaseDetailsById[releaseId] ?? defaultReleaseDetail;

    return {
      ...detail,
      id: Number(releaseId) || detail.id,
    };
  };

  mockApi.discogsRelease.mockImplementation(async (releaseId) =>
    resolveDetail(releaseId),
  );

  mockApi.discogsReleaseBatch.mockImplementation(async (ids) => {
    const releases: Record<string, DiscogsReleaseDetail> = {};

    for (const releaseId of ids) {
      releases[releaseId] = resolveDetail(releaseId);
    }

    return releases;
  });
};
