import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";

type LoadPublicReleaseDiscogsDetailUncached = (
  releaseId: string,
) => Promise<DiscogsReleaseDetail | null>;

const mockLoadDetail =
  jest.fn() as jest.MockedFunction<LoadPublicReleaseDiscogsDetailUncached>;

jest.mock("src/lib/public-release-discogs-detail.server", () => ({
  loadPublicReleaseDiscogsDetailForPage: (
    ...args: Parameters<LoadPublicReleaseDiscogsDetailUncached>
  ) => mockLoadDetail(...args),
}));

describe("getPublicReleaseMetadataForPage", () => {
  let getPublicReleaseMetadataForPage: typeof import("src/lib/public-release-page-metadata.server").getPublicReleaseMetadataForPage;

  beforeEach(async () => {
    jest.resetModules();
    mockLoadDetail.mockReset();
    ({ getPublicReleaseMetadataForPage } = await import(
      "src/lib/public-release-page-metadata.server"
    ));
  });

  it("returns null when the release loader returns null", async () => {
    mockLoadDetail.mockResolvedValue(null);

    await expect(getPublicReleaseMetadataForPage("123")).resolves.toBeNull();
    expect(mockLoadDetail).toHaveBeenCalledWith("123");
  });

  it("builds title and description from loaded release detail", async () => {
    mockLoadDetail.mockResolvedValue({
      id: 1,
      uri: "https://www.discogs.com/release/1",
      title: "Album",
      artists: [{ name: "A", join: "" }],
      year: 2020,
      labels: [{ name: "L", catno: "CAT1" }],
    });

    const resolved = await getPublicReleaseMetadataForPage("1");

    expect(resolved?.title).toBe("Album");
    expect(resolved?.description).toContain("Album");
    expect(resolved?.description).toContain("A");
    expect(resolved?.description).toContain("2020");
    expect(resolved?.description).toContain("CAT1");
  });
});
