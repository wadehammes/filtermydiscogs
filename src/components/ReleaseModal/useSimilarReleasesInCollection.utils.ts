import { RELEASE_MODAL_SIMILAR_LIMIT } from "src/constants/collection";
import type { DiscogsRelease } from "src/types";
import { getSimilarReleasesModalSnapshot } from "src/utils/similarReleases";
import {
  canShuffleSimilarReleaseBatch,
  planSimilarReleaseShuffle,
} from "src/utils/similarReleasesShuffle";

export const isDeferredSimilarAnchorReady = (
  deferredSimilarSourceKey: string | null,
  release: DiscogsRelease | null,
  isCollectionLoading: boolean,
): release is DiscogsRelease =>
  Boolean(
    deferredSimilarSourceKey &&
      release &&
      !isCollectionLoading &&
      String(release.instance_id) === deferredSimilarSourceKey,
  );

export const getModalSimilarReleasesSnapshot = ({
  release,
  releasesForSimilar,
  excludedInstanceIds,
  shuffleSeed,
}: {
  release: DiscogsRelease;
  releasesForSimilar: DiscogsRelease[];
  excludedInstanceIds: Set<string>;
  shuffleSeed: number;
}) =>
  getSimilarReleasesModalSnapshot({
    releases: releasesForSimilar,
    sourceRelease: release,
    batchLimit: RELEASE_MODAL_SIMILAR_LIMIT,
    excludedInstanceIds,
    ...(shuffleSeed > 0 ? { tieBreakSeed: shuffleSeed } : {}),
  });

export const getCanShuffleSimilarReleases = ({
  release,
  releasesForSimilar,
  excludedInstanceIds,
  similarReleases,
  totalSimilarMatchCount,
}: {
  release: DiscogsRelease;
  releasesForSimilar: DiscogsRelease[];
  excludedInstanceIds: Set<string>;
  similarReleases: DiscogsRelease[];
  totalSimilarMatchCount: number;
}): boolean => {
  if (similarReleases.length === 0) {
    return false;
  }

  if (similarReleases.length > 1) {
    return true;
  }

  if (
    excludedInstanceIds.size === 0 &&
    totalSimilarMatchCount > similarReleases.length
  ) {
    return true;
  }

  return canShuffleSimilarReleaseBatch({
    releases: releasesForSimilar,
    sourceRelease: release,
    limit: RELEASE_MODAL_SIMILAR_LIMIT,
    excludedInstanceIds,
    visibleBatch: similarReleases,
  });
};

export const planModalSimilarReleaseShuffle = ({
  release,
  releasesForSimilar,
  excludedInstanceIds,
  shuffleSeed,
  visibleBatch,
}: {
  release: DiscogsRelease;
  releasesForSimilar: DiscogsRelease[];
  excludedInstanceIds: Set<string>;
  shuffleSeed: number;
  visibleBatch: DiscogsRelease[];
}) =>
  planSimilarReleaseShuffle({
    releases: releasesForSimilar,
    sourceRelease: release,
    limit: RELEASE_MODAL_SIMILAR_LIMIT,
    excludedInstanceIds,
    tieBreakSeed: shuffleSeed,
    visibleBatch,
  });
