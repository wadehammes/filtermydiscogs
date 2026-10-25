import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

let revalidatePublicShareSeo: typeof import("src/lib/public-share-cache.server")["revalidatePublicShareSeo"];
let mockRevalidatePath: jest.MockedFunction<
  typeof import("next/cache")["revalidatePath"]
>;
let mockRevalidateTag: jest.MockedFunction<
  typeof import("next/cache")["revalidateTag"]
>;

describe("revalidatePublicShareSeo", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [cacheModule, nextCache] = await Promise.all([
      import("src/lib/public-share-cache.server"),
      import("next/cache"),
    ]);
    revalidatePublicShareSeo = cacheModule.revalidatePublicShareSeo;
    mockRevalidatePath = jest.mocked(nextCache.revalidatePath);
    mockRevalidateTag = jest.mocked(nextCache.revalidateTag);
  });

  it("when a crate privacy changes, revalidates crate cache, sitemap, and paths", () => {
    const crateId = "ab65c378-fab9-42c0-96bb-c308d413cbbb";

    revalidatePublicShareSeo({ kind: "crate", id: crateId });

    expect(mockRevalidateTag).toHaveBeenCalledWith(`public-crate:${crateId}`, {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("public-sitemap", {
      expire: 0,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/crate/${crateId}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("when a playlist privacy changes, revalidates playlist cache, sitemap, and paths", () => {
    const playlistId = "11111111-2222-3333-4444-555555555555";

    revalidatePublicShareSeo({ kind: "playlist", id: playlistId });

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `public-playlist:${playlistId}`,
      { expire: 0 },
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("public-sitemap", {
      expire: 0,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/playlist/${playlistId}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });
});
