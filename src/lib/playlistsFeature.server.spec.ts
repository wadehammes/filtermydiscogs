import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

type PlaylistsFeatureServerModule =
  typeof import("src/lib/playlistsFeature.server");

let getPlaylistsFeatureEnabled: PlaylistsFeatureServerModule["getPlaylistsFeatureEnabled"];
let resolvePlaylistsFeatureLocalOverride: PlaylistsFeatureServerModule["resolvePlaylistsFeatureLocalOverride"];

describe("playlistsFeature.server", () => {
  const originalOverride = process.env.PLAYLISTS_FEATURE_OVERRIDE;
  const originalE2eMock = process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;

  beforeEach(async () => {
    const serverModule = await import("src/lib/playlistsFeature.server");

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

  it("getPlaylistsFeatureEnabled uses local override before defaulting to on", async () => {
    process.env.PLAYLISTS_FEATURE_OVERRIDE = "0";

    await expect(getPlaylistsFeatureEnabled()).resolves.toBe(false);
  });

  it("getPlaylistsFeatureEnabled defaults to on when no override applies", async () => {
    await expect(getPlaylistsFeatureEnabled()).resolves.toBe(true);
  });
});
