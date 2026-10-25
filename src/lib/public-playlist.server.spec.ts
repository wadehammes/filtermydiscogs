import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
  PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
} from "src/constants/publicPlaylist.constants";
import { publicPlaylistResponseFactory } from "src/tests/factories/PublicPlaylistResponse.factory";

jest.mock("next/cache", () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    playlist: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("src/lib/sentry/reportInfrastructureFailure", () => ({
  reportInfrastructureFailure: jest.fn(),
}));

jest.mock("src/lib/public-playlist-load.server", () => ({
  loadPublicPlaylist: jest.fn(),
}));

type DbModule = typeof import("src/lib/db");

let getPublicPlaylistIdsForStaticGeneration: typeof import("src/lib/public-playlist.server")["getPublicPlaylistIdsForStaticGeneration"];
let getPublicPlaylistForPage: typeof import("src/lib/public-playlist.server")["getPublicPlaylistForPage"];
let getPublicPlaylistForOg: typeof import("src/lib/public-playlist.server")["getPublicPlaylistForOg"];
let mockFindMany: jest.MockedFunction<
  DbModule["prisma"]["playlist"]["findMany"]
>;
let mockLoadPublicPlaylist: jest.MockedFunction<
  typeof import("src/lib/public-playlist-load.server")["loadPublicPlaylist"]
>;

describe("getPublicPlaylistIdsForStaticGeneration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.DATABASE_URL =
      "postgres://user:pass@pooled.db.prisma.io:5432/postgres?sslmode=require";

    const [serverModule, db, loadModule] = await Promise.all([
      import("src/lib/public-playlist.server"),
      import("src/lib/db"),
      import("src/lib/public-playlist-load.server"),
    ]);
    getPublicPlaylistIdsForStaticGeneration =
      serverModule.getPublicPlaylistIdsForStaticGeneration;
    getPublicPlaylistForPage = serverModule.getPublicPlaylistForPage;
    mockFindMany = jest.mocked(db.prisma.playlist.findMany);
    mockLoadPublicPlaylist = jest.mocked(loadModule.loadPublicPlaylist);
    mockFindMany.mockReset();
    mockFindMany.mockResolvedValue([]);
    mockLoadPublicPlaylist.mockReset();
  });

  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_POOLED;
    delete process.env.NEXT_PHASE;
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
  });

  it("when no runtime database URL is configured, returns placeholder id", async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_URL_POOLED;
    delete process.env.DIRECT_URL;

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
    ]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("when query returns no public playlists, returns placeholder id", async () => {
    mockFindMany.mockResolvedValue([]);

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
    ]);
  });

  it("when build query returns no public playlists, returns demo playlist id", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    mockFindMany.mockResolvedValue([]);

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
    ]);
  });

  it("when query fails, returns placeholder id for generateStaticParams", async () => {
    mockFindMany.mockRejectedValue(new Error("too many connections"));

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
    ]);
  });

  it("when query fails during production build, returns demo playlist id", async () => {
    process.env.NEXT_PHASE = "phase-production-build";
    mockFindMany.mockRejectedValue(new Error("too many connections"));

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
    ]);
  });

  it("when public playlists exist, returns fallback ids plus playlist ids", async () => {
    mockFindMany.mockResolvedValue([
      { id: "playlist-a" },
      { id: "playlist-b" },
    ] as never);

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
      "playlist-a",
      "playlist-b",
    ]);
  });

  it("when public playlists exist during E2E build, returns demo id first", async () => {
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";
    mockFindMany.mockResolvedValue([{ id: "playlist-a" }] as never);

    await expect(getPublicPlaylistIdsForStaticGeneration(25)).resolves.toEqual([
      LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
      PUBLIC_PLAYLIST_STATIC_PARAM_PLACEHOLDER_ID,
      "playlist-a",
    ]);
  });
});

describe("getPublicPlaylistForPage", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const [serverModule, loadModule] = await Promise.all([
      import("src/lib/public-playlist.server"),
      import("src/lib/public-playlist-load.server"),
    ]);
    getPublicPlaylistForPage = serverModule.getPublicPlaylistForPage;
    mockLoadPublicPlaylist = jest.mocked(loadModule.loadPublicPlaylist);
    mockLoadPublicPlaylist.mockReset();
  });

  it("when the playlist id is invalid, returns null without loading tracks", async () => {
    await expect(getPublicPlaylistForPage("not-a-uuid")).resolves.toBeNull();
    expect(mockLoadPublicPlaylist).not.toHaveBeenCalled();
  });

  it("when loadPublicPlaylist succeeds, returns the payload", async () => {
    const payload = publicPlaylistResponseFactory.build();
    mockLoadPublicPlaylist.mockResolvedValue(payload);

    await expect(
      getPublicPlaylistForPage(payload.playlist.id),
    ).resolves.toEqual(payload);
    expect(mockLoadPublicPlaylist).toHaveBeenCalledWith(payload.playlist.id);
  });
});

describe("getPublicPlaylistForOg", () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    const [serverModule, loadModule] = await Promise.all([
      import("src/lib/public-playlist.server"),
      import("src/lib/public-playlist-load.server"),
    ]);
    getPublicPlaylistForOg = serverModule.getPublicPlaylistForOg;
    mockLoadPublicPlaylist = jest.mocked(loadModule.loadPublicPlaylist);
    mockLoadPublicPlaylist.mockReset();
  });

  it("when loadPublicPlaylist succeeds, returns name, username, and up to four cover urls", async () => {
    const payload = publicPlaylistResponseFactory.build({
      mosaicThumbUrls: [
        "https://i.discogs.com/0.jpg",
        "https://i.discogs.com/1.jpg",
        "https://i.discogs.com/2.jpg",
        "https://i.discogs.com/3.jpg",
        "https://i.discogs.com/4.jpg",
      ],
    });
    mockLoadPublicPlaylist.mockResolvedValue(payload);

    await expect(getPublicPlaylistForOg(payload.playlist.id)).resolves.toEqual({
      name: payload.playlist.name,
      username: payload.playlist.username,
      coverThumbUrls: payload.mosaicThumbUrls.slice(0, 4),
    });
  });

  it("when the playlist is missing, returns null", async () => {
    mockLoadPublicPlaylist.mockResolvedValue(null);

    await expect(
      getPublicPlaylistForOg("11111111-2222-3333-4444-555555555555"),
    ).resolves.toBeNull();
  });
});
