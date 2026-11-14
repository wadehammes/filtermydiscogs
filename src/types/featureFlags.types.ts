export type FeatureFlags = {
  playlists: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  playlists: true,
};

export type FeatureFlagKey = keyof FeatureFlags;
