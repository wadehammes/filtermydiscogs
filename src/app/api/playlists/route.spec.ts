import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest, NextResponse } from "next/server";
import { playlistSummaryFactory } from "src/tests/factories/PlaylistSummary.factory";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/playlist.server", () => ({
  listPlaylistsForUser: jest.fn(),
  createPlaylist: jest.fn(),
}));

jest.mock("src/lib/api-helpers");

jest.mock("src/lib/playlistsFeature.server", () => ({
  getPlaylistsFeatureEnabled: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/playlists/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type PlaylistServerModule = typeof import("src/lib/playlist.server");
type PlaylistsFeatureModule = typeof import("src/lib/playlistsFeature.server");

let GET: RouteModule["GET"];
let POST: RouteModule["POST"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockListPlaylistsForUser: jest.MockedFunction<
  PlaylistServerModule["listPlaylistsForUser"]
>;
let mockCreatePlaylist: jest.MockedFunction<
  PlaylistServerModule["createPlaylist"]
>;
let mockGetPlaylistsFeatureEnabled: jest.MockedFunction<
  PlaylistsFeatureModule["getPlaylistsFeatureEnabled"]
>;

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, playlistServer, playlistsFeature] =
    await Promise.all([
      import("src/app/api/playlists/route"),
      import("src/lib/api-helpers"),
      import("src/lib/playlist.server"),
      import("src/lib/playlistsFeature.server"),
    ]);

  GET = routeModule.GET;
  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockListPlaylistsForUser = jest.mocked(playlistServer.listPlaylistsForUser);
  mockCreatePlaylist = jest.mocked(playlistServer.createPlaylist);
  mockGetPlaylistsFeatureEnabled = jest.mocked(
    playlistsFeature.getPlaylistsFeatureEnabled,
  );
});

describe("/api/playlists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockGetPlaylistsFeatureEnabled.mockResolvedValue(true);
  });

  it("GET returns playlists for the verified user", async () => {
    const playlists = [playlistSummaryFactory.empty()];
    mockListPlaylistsForUser.mockResolvedValue(playlists);

    const response = await GET(
      new NextRequest("http://localhost/api/playlists"),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ playlists });
    expect(mockListPlaylistsForUser).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      undefined,
    );
  });

  it("GET forwards trackKey when listing playlist membership for a track", async () => {
    const playlists = [playlistSummaryFactory.empty({ containsTrack: true })];
    mockListPlaylistsForUser.mockResolvedValue(playlists);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/playlists?trackKey=instance-1%3AA1",
      ),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ playlists });
    expect(mockListPlaylistsForUser).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      { trackKey: "instance-1:A1" },
    );
  });

  it("POST creates a playlist with strict rate limiting", async () => {
    const playlist = playlistSummaryFactory.empty({ name: "Sunday" });
    mockCreatePlaylist.mockResolvedValue(playlist);

    const response = await POST(
      new NextRequest("http://localhost/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Sunday" }),
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json).toEqual({ playlist });
    expect(mockGetVerifiedUser).toHaveBeenCalledWith(
      expect.any(NextRequest),
      true,
    );
    expect(mockCreatePlaylist).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      "Sunday",
    );
  });

  it("returns 404 when the playlists feature flag is off", async () => {
    mockGetPlaylistsFeatureEnabled.mockResolvedValue(false);

    const response = await GET(
      new NextRequest("http://localhost/api/playlists"),
    );

    expect(response.status).toBe(404);
    expect(mockListPlaylistsForUser).not.toHaveBeenCalled();
  });

  it("returns auth error when verification fails", async () => {
    const authError = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    mockGetVerifiedUser.mockResolvedValue({ error: authError });

    const response = await GET(
      new NextRequest("http://localhost/api/playlists"),
    );

    expect(response.status).toBe(401);
    expect(mockListPlaylistsForUser).not.toHaveBeenCalled();
  });
});
