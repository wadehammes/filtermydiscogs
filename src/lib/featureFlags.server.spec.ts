import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("src/lib/playlistsFeature.server", () => ({
  getPlaylistsFeatureEnabled: jest.fn(),
}));

type PlaylistsFeatureModule = typeof import("src/lib/playlistsFeature.server");

let getFeatureFlags: typeof import("src/lib/featureFlags.server")["getFeatureFlags"];
let mockGetPlaylistsFeatureEnabled: jest.MockedFunction<
  PlaylistsFeatureModule["getPlaylistsFeatureEnabled"]
>;

describe("featureFlags.server", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [featureFlagsModule, playlistsFeatureModule] = await Promise.all([
      import("src/lib/featureFlags.server"),
      import("src/lib/playlistsFeature.server"),
    ]);
    getFeatureFlags = featureFlagsModule.getFeatureFlags;
    mockGetPlaylistsFeatureEnabled = jest.mocked(
      playlistsFeatureModule.getPlaylistsFeatureEnabled,
    );
  });

  it("getFeatureFlags resolves playlists from getPlaylistsFeatureEnabled", async () => {
    mockGetPlaylistsFeatureEnabled.mockResolvedValue(true);

    await expect(getFeatureFlags()).resolves.toEqual({ playlists: true });
    expect(mockGetPlaylistsFeatureEnabled).toHaveBeenCalledTimes(1);
  });
});
