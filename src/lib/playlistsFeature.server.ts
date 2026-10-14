import { cache } from "react";
import { evaluatePlaylistsFeatureFlag } from "src/lib/playlistsFeatureFlag.server";

export const resolvePlaylistsFeatureLocalOverride = (): boolean | null => {
  const override = process.env.PLAYLISTS_FEATURE_OVERRIDE;

  if (override === "1" || override === "true") {
    return true;
  }

  if (override === "0" || override === "false") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED === "1") {
    return true;
  }

  return null;
};

export const getPlaylistsFeatureEnabled = cache(async (): Promise<boolean> => {
  const localOverride = resolvePlaylistsFeatureLocalOverride();

  if (localOverride !== null) {
    return localOverride;
  }

  return evaluatePlaylistsFeatureFlag();
});
