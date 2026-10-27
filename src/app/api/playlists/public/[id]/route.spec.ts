import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import { publicPlaylistInfoFactory } from "src/tests/factories/PublicPlaylistInfo.factory";
import { publicPlaylistResponseFactory } from "src/tests/factories/PublicPlaylistResponse.factory";
import { publicPlaylistRowFactory } from "src/tests/factories/PublicPlaylistRow.factory";

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

jest.mock("src/lib/playlist-track-vote.server", () => ({
  attachViewerVotesToPlaylistTracks: jest.fn(
    async (_ownerUserId, _playlistId, tracks) => tracks,
  ),
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
    const playlistRow = publicPlaylistRowFactory.build({
      user_id: 1,
      id: PUBLIC_PLAYLIST_ID,
      name: "Shared mix",
      username: "dj",
    });
    mockFindPublicPlaylistById.mockResolvedValue(playlistRow);

    const payload = publicPlaylistResponseFactory.build({
      playlist: publicPlaylistInfoFactory.forDemoPage({
        id: PUBLIC_PLAYLIST_ID,
        name: "Shared mix",
        username: "dj",
      }),
    });
    mockLoadPublicPlaylist.mockResolvedValue(payload);

    const response = await GET(new NextRequest("http://localhost/api"), {
      params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }),
    });

    expect(response.status).toBe(200);
    expect(mockLoadPublicPlaylist).toHaveBeenCalledWith(PUBLIC_PLAYLIST_ID, {
      playlist: playlistRow,
    });
    const body = (await response.json()) as {
      playlist: { name: string };
      viewerIsOwner?: boolean;
    };
    expect(body.playlist.name).toBe(payload.playlist.name);
    expect(body.viewerIsOwner).toBe(false);
  });

  it("when the viewer owns the playlist, does not attach viewer vote state", async () => {
    const playlistRow = publicPlaylistRowFactory.build({
      user_id: 42,
      id: PUBLIC_PLAYLIST_ID,
    });
    mockFindPublicPlaylistById.mockResolvedValue(playlistRow);
    mockGetOptionalVerifiedUser.mockResolvedValue({
      userId: 42,
      username: "owner",
    });
    mockLoadPublicPlaylist.mockResolvedValue(
      publicPlaylistResponseFactory.build({
        playlist: publicPlaylistInfoFactory.forDemoPage({
          id: PUBLIC_PLAYLIST_ID,
        }),
      }),
    );

    const voteModule = await import("src/lib/playlist-track-vote.server");
    const mockAttach = jest.mocked(
      voteModule.attachViewerVotesToPlaylistTracks,
    );

    const response = await GET(new NextRequest("http://localhost/api"), {
      params: Promise.resolve({ id: PUBLIC_PLAYLIST_ID }),
    });

    expect(response.status).toBe(200);
    expect(mockAttach).not.toHaveBeenCalled();
    const body = (await response.json()) as { viewerIsOwner?: boolean };
    expect(body.viewerIsOwner).toBe(true);
  });
});
