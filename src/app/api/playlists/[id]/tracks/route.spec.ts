import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { NextRequest } from "next/server";
import { verifiedDiscogsUserFactory } from "src/tests/factories/VerifiedDiscogsUser.factory";

jest.mock("src/lib/playlist.server", () => ({
  removeTrackFromPlaylist: jest.fn(),
}));

jest.mock("src/lib/api-helpers");

jest.mock("src/lib/playlistsFeature.server", () => ({
  getPlaylistsFeatureEnabled: jest.fn(),
}));

jest.mock("src/lib/public-share-cache.server", () => ({
  revalidatePublicPlaylistShareWhenPublic: jest.fn(),
}));

type RouteModule = typeof import("src/app/api/playlists/[id]/tracks/route");
type ApiHelpersModule = typeof import("src/lib/api-helpers");
type PlaylistServerModule = typeof import("src/lib/playlist.server");
type PlaylistsFeatureModule = typeof import("src/lib/playlistsFeature.server");
type PublicShareCacheModule =
  typeof import("src/lib/public-share-cache.server");

let DELETE: RouteModule["DELETE"];
let mockGetVerifiedUser: jest.MockedFunction<
  ApiHelpersModule["getVerifiedUserFromRequestWithRateLimit"]
>;
let mockRemoveTrackFromPlaylist: jest.MockedFunction<
  PlaylistServerModule["removeTrackFromPlaylist"]
>;
let mockGetPlaylistsFeatureEnabled: jest.MockedFunction<
  PlaylistsFeatureModule["getPlaylistsFeatureEnabled"]
>;
let mockRevalidatePublicPlaylistShareWhenPublic: jest.MockedFunction<
  PublicShareCacheModule["revalidatePublicPlaylistShareWhenPublic"]
>;

const playlistId = "11111111-2222-3333-4444-555555555555";
const verifiedUser = verifiedDiscogsUserFactory.asVerifiedResult({
  userId: 42,
});

beforeAll(async () => {
  const [
    routeModule,
    apiHelpers,
    playlistServer,
    playlistsFeature,
    publicShareCache,
  ] = await Promise.all([
    import("src/app/api/playlists/[id]/tracks/route"),
    import("src/lib/api-helpers"),
    import("src/lib/playlist.server"),
    import("src/lib/playlistsFeature.server"),
    import("src/lib/public-share-cache.server"),
  ]);

  DELETE = routeModule.DELETE;
  mockGetVerifiedUser = jest.mocked(
    apiHelpers.getVerifiedUserFromRequestWithRateLimit,
  );
  mockRemoveTrackFromPlaylist = jest.mocked(
    playlistServer.removeTrackFromPlaylist,
  );
  mockGetPlaylistsFeatureEnabled = jest.mocked(
    playlistsFeature.getPlaylistsFeatureEnabled,
  );
  mockRevalidatePublicPlaylistShareWhenPublic = jest.mocked(
    publicShareCache.revalidatePublicPlaylistShareWhenPublic,
  );
});

describe("/api/playlists/[id]/tracks DELETE", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVerifiedUser.mockResolvedValue(verifiedUser);
    mockGetPlaylistsFeatureEnabled.mockResolvedValue(true);
    mockRemoveTrackFromPlaylist.mockResolvedValue(true);
    mockRevalidatePublicPlaylistShareWhenPublic.mockResolvedValue(undefined);
  });

  it("revalidates the public share when a track is removed", async () => {
    const request = new NextRequest(
      `http://localhost/api/playlists/${playlistId}/tracks`,
      {
        method: "DELETE",
        body: JSON.stringify({ track_key: "inst-1:A1" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: playlistId }),
    });

    expect(response.status).toBe(200);
    expect(mockRemoveTrackFromPlaylist).toHaveBeenCalledWith(
      verifiedUser.user.userId,
      playlistId,
      "inst-1:A1",
    );
    expect(mockRevalidatePublicPlaylistShareWhenPublic).toHaveBeenCalledWith(
      playlistId,
    );
  });

  it("does not revalidate when the track was not found", async () => {
    mockRemoveTrackFromPlaylist.mockResolvedValue(false);

    const request = new NextRequest(
      `http://localhost/api/playlists/${playlistId}/tracks`,
      {
        method: "DELETE",
        body: JSON.stringify({ track_key: "missing:A1" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await DELETE(request, {
      params: Promise.resolve({ id: playlistId }),
    });

    expect(response.status).toBe(404);
    expect(mockRevalidatePublicPlaylistShareWhenPublic).not.toHaveBeenCalled();
  });
});
