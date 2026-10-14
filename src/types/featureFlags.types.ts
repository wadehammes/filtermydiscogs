export type FeatureFlags = {
  playlists: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  playlists: false,
};

export type FeatureFlagKey = keyof FeatureFlags;
