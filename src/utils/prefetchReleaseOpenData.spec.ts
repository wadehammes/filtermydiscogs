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

    prefetchReleaseOpenData(queryClient, release, {
      cancelOtherFetches: true,
    });

    await queryClient.fetchQuery({
      queryKey: DiscogsReleaseQueryKeys.byId(String(releaseId)),
    });

    expect(mockApi.discogsRelease).toHaveBeenCalledWith(
      String(releaseId),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("cancels other in-flight discogs release prefetches before starting a new one", async () => {
    const firstRelease = releaseFactory.withDisplayDefaults();
    const secondRelease = releaseFactory.withTitle("Second Album", 888001);
    const firstReleaseId = String(parseReleaseId(firstRelease));
    const secondReleaseId = String(parseReleaseId(secondRelease));
    let resolveFirstFetch!: () => void;

    mockApi.discogsRelease.mockImplementation(
      (releaseId) =>
        new Promise((resolve) => {
          if (releaseId === firstReleaseId) {
            resolveFirstFetch = () => {
              resolve(
                discogsReleaseJsonFactory.withTracklistAndVideos({
                  id: Number(firstReleaseId),
                }),
              );
            };
            return;
          }

          resolve(
            discogsReleaseJsonFactory.withTracklistAndVideos({
              id: Number(releaseId),
            }),
          );
        }),
    );

    prefetchReleaseOpenData(queryClient, firstRelease, {
      cancelOtherFetches: true,
    });

    await waitForQueryFetchStatus(
      queryClient,
      DiscogsReleaseQueryKeys.byId(firstReleaseId),
      "fetching",
    );

    prefetchReleaseOpenData(queryClient, secondRelease, {
      cancelOtherFetches: true,
    });

    await queryClient.fetchQuery({
      queryKey: DiscogsReleaseQueryKeys.byId(secondReleaseId),
    });

    expect(mockApi.discogsRelease).toHaveBeenCalledWith(
      secondReleaseId,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    resolveFirstFetch();

    await waitForQueryFetchStatus(
      queryClient,
      DiscogsReleaseQueryKeys.byId(firstReleaseId),
      "idle",
    );

    expect(
      queryClient.getQueryData(DiscogsReleaseQueryKeys.byId(firstReleaseId)),
    ).toBeUndefined();
    expect(
      queryClient.getQueryData(DiscogsReleaseQueryKeys.byId(secondReleaseId)),
    ).toBeDefined();
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

const waitForQueryFetchStatus = async (
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  fetchStatus: string,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (queryClient.getQueryState(queryKey)?.fetchStatus === fetchStatus) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  throw new Error(
    `Timed out waiting for ${String(queryKey)} fetchStatus=${fetchStatus}`,
  );
};
