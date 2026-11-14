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

type RouteModule = typeof import("src/app/api/playlists/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type PlaylistServerModule = typeof import("src/lib/playlist.server");

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

const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [routeModule, apiHelpers, playlistServer] = await Promise.all([
    import("src/app/api/playlists/route"),
    import("src/lib/api-helpers"),
    import("src/lib/playlist.server"),
  ]);

  GET = routeModule.GET;
  POST = routeModule.POST;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockListPlaylistsForUser = jest.mocked(playlistServer.listPlaylistsForUser);
  mockCreatePlaylist = jest.mocked(playlistServer.createPlaylist);
});

describe("/api/playlists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
      return new NextResponse(JSON.stringify(body), init);
    });
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
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

  it("GET passes trackKey to listPlaylistsForUser when provided", async () => {
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

  it("POST creates a playlist for the verified user", async () => {
    const created = playlistSummaryFactory.empty({ name: "Sunday" });
    mockCreatePlaylist.mockResolvedValue(created);

    const response = await POST(
      new NextRequest("http://localhost/api/playlists", {
        method: "POST",
        body: JSON.stringify({
          name: "Sunday",
          publicDescription: "Morning warm-up set.",
        }),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(201);
    expect(mockCreatePlaylist).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      "Sunday",
      "Morning warm-up set.",
    );
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
