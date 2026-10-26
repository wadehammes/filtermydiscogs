import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { publicCrateRowFactory } from "src/tests/factories/PublicCrateRow.factory";
import { publicPlaylistRowFactory } from "src/tests/factories/PublicPlaylistRow.factory";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("src/lib/public-crate-query.server", () => ({
  findPublicCrateById: jest.fn(),
  listPublicCrateIdsFrom: jest.fn(),
}));

jest.mock("src/lib/public-playlist-query.server", () => ({
  findPublicPlaylistById: jest.fn(),
}));

let revalidatePublicShareSeo: typeof import("src/lib/public-share-cache.server")["revalidatePublicShareSeo"];
let revalidatePublicCrateShareWhenPublic: typeof import("src/lib/public-share-cache.server")["revalidatePublicCrateShareWhenPublic"];
let revalidatePublicCrateSharesWhenPublic: typeof import("src/lib/public-share-cache.server")["revalidatePublicCrateSharesWhenPublic"];
let revalidatePublicPlaylistShareWhenPublic: typeof import("src/lib/public-share-cache.server")["revalidatePublicPlaylistShareWhenPublic"];
let mockFindPublicCrateById: jest.MockedFunction<
  typeof import("src/lib/public-crate-query.server")["findPublicCrateById"]
>;
let mockListPublicCrateIdsFrom: jest.MockedFunction<
  typeof import("src/lib/public-crate-query.server")["listPublicCrateIdsFrom"]
>;
let mockFindPublicPlaylistById: jest.MockedFunction<
  typeof import("src/lib/public-playlist-query.server")["findPublicPlaylistById"]
>;
let mockRevalidatePath: jest.MockedFunction<
  typeof import("next/cache")["revalidatePath"]
>;
let mockRevalidateTag: jest.MockedFunction<
  typeof import("next/cache")["revalidateTag"]
>;

beforeAll(async () => {
  const [cacheModule, nextCache, publicCrateQuery, publicPlaylistQuery] =
    await Promise.all([
      import("src/lib/public-share-cache.server"),
      import("next/cache"),
      import("src/lib/public-crate-query.server"),
      import("src/lib/public-playlist-query.server"),
    ]);

  revalidatePublicShareSeo = cacheModule.revalidatePublicShareSeo;
  revalidatePublicCrateShareWhenPublic =
    cacheModule.revalidatePublicCrateShareWhenPublic;
  revalidatePublicCrateSharesWhenPublic =
    cacheModule.revalidatePublicCrateSharesWhenPublic;
  revalidatePublicPlaylistShareWhenPublic =
    cacheModule.revalidatePublicPlaylistShareWhenPublic;
  mockFindPublicCrateById = jest.mocked(publicCrateQuery.findPublicCrateById);
  mockListPublicCrateIdsFrom = jest.mocked(
    publicCrateQuery.listPublicCrateIdsFrom,
  );
  mockFindPublicPlaylistById = jest.mocked(
    publicPlaylistQuery.findPublicPlaylistById,
  );
  mockRevalidatePath = jest.mocked(nextCache.revalidatePath);
  mockRevalidateTag = jest.mocked(nextCache.revalidateTag);
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("revalidatePublicShareSeo", () => {
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

describe("revalidatePublicCrateShareWhenPublic", () => {
  it("when the crate is not public, does not revalidate", async () => {
    mockFindPublicCrateById.mockResolvedValue(null);

    await revalidatePublicCrateShareWhenPublic(
      "ab65c378-fab9-42c0-96bb-c308d413cbbb",
    );

    expect(mockRevalidateTag).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("when the crate is public, revalidates the share cache", async () => {
    const row = publicCrateRowFactory.build({
      id: "ab65c378-fab9-42c0-96bb-c308d413cbbb",
      private: false,
    });
    mockFindPublicCrateById.mockResolvedValue(row);

    await revalidatePublicCrateShareWhenPublic(row.id);

    expect(mockRevalidateTag).toHaveBeenCalledWith(`public-crate:${row.id}`, {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("public-sitemap", {
      expire: 0,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/crate/${row.id}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("revalidatePublicCrateSharesWhenPublic uses one batched public lookup", async () => {
    const row = publicCrateRowFactory.build({ private: false });
    mockListPublicCrateIdsFrom.mockResolvedValue([row.id]);

    await revalidatePublicCrateSharesWhenPublic([row.id, row.id]);

    expect(mockListPublicCrateIdsFrom).toHaveBeenCalledWith([row.id, row.id]);
    expect(mockFindPublicCrateById).not.toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith(`public-crate:${row.id}`, {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("public-sitemap", {
      expire: 0,
    });
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });
});

describe("revalidatePublicPlaylistShareWhenPublic", () => {
  it("when the playlist is not public, does not revalidate", async () => {
    mockFindPublicPlaylistById.mockResolvedValue(null);

    await revalidatePublicPlaylistShareWhenPublic(
      "11111111-2222-3333-4444-555555555555",
    );

    expect(mockRevalidateTag).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("when the playlist is public, revalidates the share cache", async () => {
    const row = publicPlaylistRowFactory.build({
      id: "11111111-2222-3333-4444-555555555555",
      private: false,
    });
    mockFindPublicPlaylistById.mockResolvedValue(row);

    await revalidatePublicPlaylistShareWhenPublic(row.id);

    expect(mockRevalidateTag).toHaveBeenCalledWith(
      `public-playlist:${row.id}`,
      { expire: 0 },
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("public-sitemap", {
      expire: 0,
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/playlist/${row.id}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
  });
});
