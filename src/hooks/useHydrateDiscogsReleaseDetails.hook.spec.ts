import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useHydrateDiscogsReleaseDetails } from "src/hooks/useHydrateDiscogsReleaseDetails.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import { renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("useHydrateDiscogsReleaseDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockApi, {
      discogsRelease: jest.fn(),
      discogsReleaseBatch: jest.fn(),
    });
  });

  it("when release ids are provided, loads details via batch and exposes a map", async () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    setupFetchDiscogsReleaseMock(mockApi, detail);

    const { result } = renderFeatureHook(() =>
      useHydrateDiscogsReleaseDetails({
        releaseIds: ["249504"],
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.data?.get("249504")?.id).toBe(249504);
    });

    expect(mockApi.discogsReleaseBatch).toHaveBeenCalledTimes(1);
    expect(mockApi.discogsReleaseBatch).toHaveBeenCalledWith(["249504"]);
    expect(mockApi.discogsRelease).not.toHaveBeenCalled();
  });

  it("when release detail is already in the query cache, exposes it from placeholderData and skips batch", async () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
      thumb: "https://i.discogs.com/cached-thumb.jpg",
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    queryClient.setQueryData(
      discogsReleaseQueryOptions("249504").queryKey,
      detail,
    );

    const { result } = renderFeatureHook(
      () =>
        useHydrateDiscogsReleaseDetails({
          releaseIds: ["249504"],
          enabled: true,
        }),
      { queryClient },
    );

    await waitFor(() => {
      expect(result.current.data?.get("249504")?.thumb).toBe(
        "https://i.discogs.com/cached-thumb.jpg",
      );
    });

    expect(mockApi.discogsReleaseBatch).not.toHaveBeenCalled();
  });

  it("when releaseIds array identity changes but normalized ids match, does not start another batch fetch", async () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    setupFetchDiscogsReleaseMock(mockApi, detail);

    const { rerender } = renderFeatureHook(
      ({ ids }: { ids: readonly string[] }) =>
        useHydrateDiscogsReleaseDetails({
          releaseIds: ids,
          enabled: true,
        }),
      {
        initialProps: { ids: ["249504"] as readonly string[] },
      },
    );

    await waitFor(() => {
      expect(mockApi.discogsReleaseBatch).toHaveBeenCalledTimes(1);
    });

    rerender({ ids: ["249504"] as readonly string[] });

    await waitFor(() => {
      expect(mockApi.discogsReleaseBatch).toHaveBeenCalledTimes(1);
    });
  });
});
