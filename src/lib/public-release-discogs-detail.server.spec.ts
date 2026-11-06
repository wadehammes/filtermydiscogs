import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockConnection = jest.fn<() => Promise<void>>(() => Promise.resolve());

jest.mock("next/server", () => ({
  connection: () => mockConnection(),
}));

type FetchDiscogsReleaseRecord =
  typeof import("src/lib/fetchDiscogsReleaseRecord.server").fetchDiscogsReleaseRecord;

const mockFetchDiscogsReleaseRecord =
  jest.fn() as jest.MockedFunction<FetchDiscogsReleaseRecord>;

jest.mock("src/lib/fetchDiscogsReleaseRecord.server", () => ({
  fetchDiscogsReleaseRecord: (...args: Parameters<FetchDiscogsReleaseRecord>) =>
    mockFetchDiscogsReleaseRecord(...args),
}));

describe("loadPublicReleaseDiscogsDetailForPage", () => {
  let loadPublicReleaseDiscogsDetailForPage: typeof import("src/lib/public-release-discogs-detail.server").loadPublicReleaseDiscogsDetailForPage;

  beforeEach(async () => {
    jest.resetModules();
    mockConnection.mockClear();
    mockFetchDiscogsReleaseRecord.mockReset();
    ({ loadPublicReleaseDiscogsDetailForPage } = await import(
      "src/lib/public-release-discogs-detail.server"
    ));
  });

  it("does not call connection when the release id is invalid", async () => {
    await loadPublicReleaseDiscogsDetailForPage("not-a-number");

    expect(mockConnection).not.toHaveBeenCalled();
    expect(mockFetchDiscogsReleaseRecord).not.toHaveBeenCalled();
  });

  it("awaits connection before fetching Discogs release detail", async () => {
    mockFetchDiscogsReleaseRecord.mockResolvedValue({
      id: 12_345,
      uri: "https://www.discogs.com/release/12345",
      title: "Test Release",
      artists: [{ name: "Artist" }],
    });

    const detail = await loadPublicReleaseDiscogsDetailForPage("12345");

    expect(mockConnection).toHaveBeenCalledTimes(1);
    expect(mockFetchDiscogsReleaseRecord).toHaveBeenCalledTimes(1);
    const connectionOrder = mockConnection.mock.invocationCallOrder[0];
    const fetchOrder =
      mockFetchDiscogsReleaseRecord.mock.invocationCallOrder[0];
    if (connectionOrder === undefined || fetchOrder === undefined) {
      throw new Error("expected mock invocation order");
    }
    expect(connectionOrder).toBeLessThan(fetchOrder);
    expect(detail?.title).toBe("Test Release");
  });

  it("returns null when the Discogs fetch times out (AbortError)", async () => {
    const abort = new DOMException("This operation was aborted", "AbortError");
    mockFetchDiscogsReleaseRecord.mockRejectedValue(abort);

    await expect(
      loadPublicReleaseDiscogsDetailForPage("38434212"),
    ).resolves.toBeNull();
  });
});
