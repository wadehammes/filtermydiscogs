import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

export const setupDiscogsReleaseQueryMock = (
  releaseDetail: DiscogsReleaseDetail,
) => {
  jest
    .mocked(useDiscogsReleaseQuery)
    .mockImplementation(({ enabled, releaseId }) => {
      if (!enabled) {
        return {
          data: undefined,
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useDiscogsReleaseQuery>;
      }

      return {
        data: {
          ...releaseDetail,
          id: Number(releaseId) || releaseDetail.id,
        },
        isLoading: false,
        isError: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useDiscogsReleaseQuery>;
    });
};
