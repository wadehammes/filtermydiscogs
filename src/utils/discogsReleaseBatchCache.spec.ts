import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { RELEASE_BATCH_MAX_IDS } from "src/constants/collection";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import {
  chunkDiscogsReleaseIds,
  fetchDiscogsReleaseDetailsIntoCache,
  getUncachedDiscogsReleaseIds,
  normalizeDiscogsReleaseIds,
  readDiscogsReleaseDetailsFromCache,
} from "src/utils/discogsReleaseBatchCache";

jest.mock("src/api/urls");

describe("discogsReleaseBatchCache", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(api, { discogsReleaseBatch: jest.fn() });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it("when release ids are duplicated or out of order, normalizes to sorted unique strings", () => {
    expect(normalizeDiscogsReleaseIds(["2", "1", "2", "3"])).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("chunks release ids at RELEASE_BATCH_MAX_IDS", () => {
    const ids = Array.from({ length: RELEASE_BATCH_MAX_IDS + 3 }, (_, index) =>
      String(index + 1),
    );

    expect(chunkDiscogsReleaseIds(ids)).toEqual([
      ids.slice(0, RELEASE_BATCH_MAX_IDS),
      ids.slice(RELEASE_BATCH_MAX_IDS),
    ]);
  });

  it("when ids are cached, getUncachedDiscogsReleaseIds omits them", () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    queryClient.setQueryData(
      discogsReleaseQueryOptions("249504").queryKey,
      detail,
    );

    expect(
      getUncachedDiscogsReleaseIds(queryClient, ["249504", "900002"]),
    ).toEqual(["900002"]);
  });

  it("fetchDiscogsReleaseDetailsIntoCache batches uncached ids and seeds per-release query keys", async () => {
    const detailA = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    const detailB = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 900002,
    });

    jest.mocked(api.discogsReleaseBatch).mockResolvedValueOnce({
      "249504": detailA,
      "900002": detailB,
    });

    await fetchDiscogsReleaseDetailsIntoCache(queryClient, [
      "249504",
      "900002",
    ]);

    expect(api.discogsReleaseBatch).toHaveBeenCalledTimes(1);
    expect(api.discogsReleaseBatch).toHaveBeenCalledWith(["249504", "900002"]);
    expect(
      readDiscogsReleaseDetailsFromCache(queryClient, ["249504", "900002"]),
    ).toEqual(
      new Map([
        ["249504", detailA],
        ["900002", detailB],
      ]),
    );
  });

  it("when all ids are cached, fetchDiscogsReleaseDetailsIntoCache skips the batch API", async () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
    });
    queryClient.setQueryData(
      discogsReleaseQueryOptions("249504").queryKey,
      detail,
    );

    await fetchDiscogsReleaseDetailsIntoCache(queryClient, ["249504"]);

    expect(api.discogsReleaseBatch).not.toHaveBeenCalled();
  });
});
