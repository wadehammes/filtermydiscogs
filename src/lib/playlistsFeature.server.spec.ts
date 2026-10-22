import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("src/lib/playlistsFeatureFlag.server", () => ({
  evaluatePlaylistsFeatureFlag: jest.fn(),
}));

type PlaylistsFeatureFlagModule =
  typeof import("src/lib/playlistsFeatureFlag.server");
type PlaylistsFeatureServerModule =
  typeof import("src/lib/playlistsFeature.server");

let getPlaylistsFeatureEnabled: PlaylistsFeatureServerModule["getPlaylistsFeatureEnabled"];
let resolvePlaylistsFeatureLocalOverride: PlaylistsFeatureServerModule["resolvePlaylistsFeatureLocalOverride"];
let mockEvaluatePlaylistsFeatureFlag: jest.MockedFunction<
  PlaylistsFeatureFlagModule["evaluatePlaylistsFeatureFlag"]
>;

describe("playlistsFeature.server", () => {
  const originalOverride = process.env.PLAYLISTS_FEATURE_OVERRIDE;
  const originalE2eMock = process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;

  beforeEach(async () => {
    jest.clearAllMocks();

    const [flagModule, serverModule] = await Promise.all([
      import("src/lib/playlistsFeatureFlag.server"),
      import("src/lib/playlistsFeature.server"),
    ]);

    mockEvaluatePlaylistsFeatureFlag = jest.mocked(
      flagModule.evaluatePlaylistsFeatureFlag,
    );
    mockEvaluatePlaylistsFeatureFlag.mockResolvedValue(true);
    getPlaylistsFeatureEnabled = serverModule.getPlaylistsFeatureEnabled;
    resolvePlaylistsFeatureLocalOverride =
      serverModule.resolvePlaylistsFeatureLocalOverride;

    delete process.env.PLAYLISTS_FEATURE_OVERRIDE;
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
  });

  afterEach(() => {
    if (originalOverride === undefined) {
      delete process.env.PLAYLISTS_FEATURE_OVERRIDE;
    } else {
      process.env.PLAYLISTS_FEATURE_OVERRIDE = originalOverride;
    }

    if (originalE2eMock === undefined) {
      delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
    } else {
      process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = originalE2eMock;
    }
  });

  it("resolvePlaylistsFeatureLocalOverride reads env overrides", () => {
    process.env.PLAYLISTS_FEATURE_OVERRIDE = "1";
    expect(resolvePlaylistsFeatureLocalOverride()).toBe(true);

    process.env.PLAYLISTS_FEATURE_OVERRIDE = "0";
    expect(resolvePlaylistsFeatureLocalOverride()).toBe(false);

    delete process.env.PLAYLISTS_FEATURE_OVERRIDE;
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";
    expect(resolvePlaylistsFeatureLocalOverride()).toBe(true);
  });

  it("getPlaylistsFeatureEnabled uses local override before the Vercel flag", async () => {
    process.env.PLAYLISTS_FEATURE_OVERRIDE = "0";
    mockEvaluatePlaylistsFeatureFlag.mockResolvedValue(true);

    await expect(getPlaylistsFeatureEnabled()).resolves.toBe(false);
    expect(mockEvaluatePlaylistsFeatureFlag).not.toHaveBeenCalled();
  });

  it("getPlaylistsFeatureEnabled evaluates the Vercel flag when no override applies", async () => {
    mockEvaluatePlaylistsFeatureFlag.mockResolvedValue(false);

    await expect(getPlaylistsFeatureEnabled()).resolves.toBe(false);
    expect(mockEvaluatePlaylistsFeatureFlag).toHaveBeenCalled();
  });
});
