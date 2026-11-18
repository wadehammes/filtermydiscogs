import {
  DISCOGS_THROTTLE_CALLERS,
  type DiscogsThrottleCaller,
} from "src/constants/discogsThrottleCaller.constants";

export const DISCOGS_THROTTLE_PRIORITY_VALUES = {
  interactive: 1,
  background: 0,
} as const;

export type DiscogsThrottlePriority =
  keyof typeof DISCOGS_THROTTLE_PRIORITY_VALUES;

const INTERACTIVE_DISCOGS_THROTTLE_CALLERS = new Set<DiscogsThrottleCaller>([
  DISCOGS_THROTTLE_CALLERS.apiRelease,
  DISCOGS_THROTTLE_CALLERS.apiReleaseBatch,
  DISCOGS_THROTTLE_CALLERS.publicReleasePage,
]);

export const resolveDiscogsThrottlePriority = (
  caller: DiscogsThrottleCaller | undefined,
): DiscogsThrottlePriority =>
  caller !== undefined && INTERACTIVE_DISCOGS_THROTTLE_CALLERS.has(caller)
    ? "interactive"
    : "background";
