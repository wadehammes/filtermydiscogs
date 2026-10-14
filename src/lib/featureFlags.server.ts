import { cache } from "react";
import { getPlaylistsFeatureEnabled } from "src/lib/playlistsFeature.server";
import type { FeatureFlags } from "src/types/featureFlags.types";

export const getFeatureFlags = cache(
  async (): Promise<FeatureFlags> => ({
    playlists: await getPlaylistsFeatureEnabled(),
  }),
);
