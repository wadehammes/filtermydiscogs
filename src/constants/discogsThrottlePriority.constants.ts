import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";

export const DISCOGS_THROTTLE_PRIORITY_VALUES = {
  interactive: 1,
  background: 0,
} as const;

export type DiscogsThrottlePriority =
  keyof typeof DISCOGS_THROTTLE_PRIORITY_VALUES;

export const resolveDiscogsThrottlePriority = (
  caller: DiscogsThrottleCaller | undefined,
): DiscogsThrottlePriority =>
  caller === "public_playlist_hydrate" ? "background" : "interactive";
