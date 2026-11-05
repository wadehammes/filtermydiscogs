import { isLargeCollection } from "src/constants/collection";
import type { DiscogsRelease } from "src/types";

export const isCollectionAnalyticsTransitionPending = (
  releases: readonly DiscogsRelease[],
  deferredReleases: readonly DiscogsRelease[],
): boolean => {
  if (!isLargeCollection(releases.length)) {
    return false;
  }

  return releases !== deferredReleases;
};
