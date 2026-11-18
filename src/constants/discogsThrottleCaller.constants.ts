export const DISCOGS_THROTTLE_CALLERS = {
  publicPlaylistHydrate: "public_playlist_hydrate",
  apiRelease: "api_release",
  apiReleaseBatch: "api_release_batch",
  publicReleasePage: "public_release_page",
} as const;

export type DiscogsThrottleCaller =
  (typeof DISCOGS_THROTTLE_CALLERS)[keyof typeof DISCOGS_THROTTLE_CALLERS];
