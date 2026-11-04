import { isLargeCollection } from "src/constants/collection";
import type { DiscogsRelease } from "src/types";

export const resolveAnalyticsReleases = (
  releases: readonly DiscogsRelease[],
  deferredReleases: readonly DiscogsRelease[],
): readonly DiscogsRelease[] => {
  if (releases.length === 0) {
    return releases;
  }

  if (isLargeCollection(releases.length)) {
    return deferredReleases;
  }

  return deferredReleases.length > 0 ? deferredReleases : releases;
};
