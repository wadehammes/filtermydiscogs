import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";

jest.mock("src/lib/fetchDiscogsReleaseRecord.server", () => ({
  fetchDiscogsReleaseRecord: jest.fn(),
}));

let fetchDiscogsReleaseRecordsSequential: typeof import("src/lib/fetchDiscogsReleaseRecordsSequential.server")["fetchDiscogsReleaseRecordsSequential"];
let mockFetchDiscogsReleaseRecord: jest.MockedFunction<
  typeof import("src/lib/fetchDiscogsReleaseRecord.server")["fetchDiscogsReleaseRecord"]
>;

describe("fetchDiscogsReleaseRecordsSequential", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [sequentialModule, fetchModule] = await Promise.all([
      import("src/lib/fetchDiscogsReleaseRecordsSequential.server"),
      import("src/lib/fetchDiscogsReleaseRecord.server"),
    ]);
    fetchDiscogsReleaseRecordsSequential =
      sequentialModule.fetchDiscogsReleaseRecordsSequential;
    mockFetchDiscogsReleaseRecord = jest.mocked(
      fetchModule.fetchDiscogsReleaseRecord,
    );
  });

  it("when multiple release ids are requested, fetches them sequentially and omits invalid ids", async () => {
    let inflight = 0;
    let maxInflight = 0;
    const detailA = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 101,
    });
    const detailB = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 202,
    });

    mockFetchDiscogsReleaseRecord.mockImplementation(async ({ releaseUrl }) => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((resolve) => {
        setTimeout(resolve, 5);
      });
      inflight -= 1;

      if (releaseUrl.endsWith("/101")) {
        return detailA;
      }

      return detailB;
    });

    const releases = await fetchDiscogsReleaseRecordsSequential({
      releaseIds: ["101", "not-a-id", "202"],
      useAuthenticatedSession: false,
    });

    expect(releases).toEqual({
      "101": detailA,
      "202": detailB,
    });
    expect(mockFetchDiscogsReleaseRecord).toHaveBeenCalledTimes(2);
    expect(maxInflight).toBe(1);
  });
});
