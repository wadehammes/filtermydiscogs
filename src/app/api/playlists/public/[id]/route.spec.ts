import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";

jest.mock("src/lib/ip-rate-limit", () => ({
  getIpRateLimitResponse: jest.fn(() => null),
  PUBLIC_CRATE_RATE_LIMIT_CONFIG: {},
}));

jest.mock("src/lib/auth-request", () => ({
  getOptionalVerifiedUserFromRequest: jest.fn(),
}));

jest.mock("src/lib/public-playlist-query.server", () => ({
  findPublicPlaylistById: jest.fn(),
}));

jest.mock("src/lib/public-playlist-load.server", () => ({
  loadPublicPlaylist: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    playlist: { update: jest.fn() },
  },
}));

type RouteModule = typeof import("src/app/api/playlists/public/[id]/route");
type QueryModule = typeof import("src/lib/public-playlist-query.server");
type LoadModule = typeof import("src/lib/public-playlist-load.server");
type AuthModule = typeof import("src/lib/auth-request");

const PUBLIC_PLAYLIST_ID = "11111111-2222-3333-4444-555555555555";

let GET: RouteModule["GET"];
let mockFindPublicPlaylistById: jest.MockedFunction<
  QueryModule["findPublicPlaylistById"]
>;
let mockLoadPublicPlaylist: jest.MockedFunction<
  LoadModule["loadPublicPlaylist"]
>;
let mockGetOptionalVerifiedUser: jest.MockedFunction<
  AuthModule["getOptionalVerifiedUserFromRequest"]
>;

beforeAll(async () => {
  const [routeModule, queryModule, loadModule, authModule] = await Promise.all([
    import("src/app/api/playlists/public/[id]/route"),
    import("src/lib/public-playlist-query.server"),
    import("src/lib/public-playlist-load.server"),
    import("src/lib/auth-request"),
  ]);

  GET = routeModule.GET;
  mockFindPublicPlaylistById = jest.mocked(queryModule.findPublicPlaylistById);
  mockLoadPublicPlaylist = jest.mocked(loadModule.loadPublicPlaylist);
  mockGetOptionalVerifiedUser = jest.mocked(
    authModule.getOptionalVerifiedUserFromRequest,
  );
});

describe("GET /api/playlists/public/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetOptionalVerifiedUser.mockResolvedValue(null);
  });

  it("returns 400 for an invalid playlist id", async () => {
    const response = await GET(new NextRequest("http://localhost/api"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 when the playlist is private or missing", async () => {
    mockFindPublicPlaylistById.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api"), {
      params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }),
    });

    expect(response.status).toBe(404);
  });

  it("returns public playlist payload when found", async () => {
    mockFindPublicPlaylistById.mockResolvedValue({
      user_id: 1,
      id: PUBLIC_PLAYLIST_ID,
      name: "Shared mix",
      username: "dj",
      private: false,
      created_at: new Date("2026-01-01"),
      updated_at: new Date("2026-01-02"),
    });

    const detail = playlistDetailFactory.build({ id: PUBLIC_PLAYLIST_ID });
    mockLoadPublicPlaylist.mockResolvedValue({
      playlist: {
        id: PUBLIC_PLAYLIST_ID,
        name: detail.name,
        username: "dj",
        private: false,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
      },
      tracks: detail.tracks,
      releases: [],
      mosaicThumbUrls: [],
    });

    const response = await GET(new NextRequest("http://localhost/api"), {
      params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { playlist: { name: string } };
    expect(body.playlist.name).toBe(detail.name);
  });
});
