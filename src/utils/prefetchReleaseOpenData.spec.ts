import { beforeEach, describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { prefetchReleaseOpenData } from "src/utils/prefetchReleaseOpenData";
import { parseReleaseId } from "src/utils/releaseNotes";

jest.mock("src/api/urls");
jest.mock("src/components/ReleaseModal/releaseModalLoader", () => ({
  loadReleaseModal: jest.fn(),
}));

const mockApi = jest.mocked(api);

describe("prefetchReleaseOpenData", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
      new Error("API request failed"),
    );
  });

  it("prefetches release detail when it is not cached", async () => {
    const release = releaseFactory.withDisplayDefaults();
    const releaseId = parseReleaseId(release);

    prefetchReleaseOpenData(queryClient, release);

    await queryClient.fetchQuery({
      queryKey: DiscogsReleaseQueryKeys.byId(String(releaseId)),
    });

    expect(mockApi.discogsRelease).toHaveBeenCalledWith(String(releaseId));
  });

  it("does not prefetch release detail when it is already cached", () => {
    const release = releaseFactory.withDisplayDefaults();
    const releaseId = parseReleaseId(release);
    const releaseQueryKey = DiscogsReleaseQueryKeys.byId(String(releaseId));

    queryClient.setQueryData(
      releaseQueryKey,
      discogsReleaseJsonFactory.withTracklistAndVideos(),
    );

    prefetchReleaseOpenData(queryClient, release);

    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
  });
});
