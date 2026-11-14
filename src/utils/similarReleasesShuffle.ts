import type { DiscogsRelease } from "src/types";
import { getSimilarReleases } from "src/utils/similarReleases";

type SimilarReleaseShuffleContext = {
  releases: DiscogsRelease[];
  sourceRelease: DiscogsRelease;
  limit: number;
  excludedInstanceIds: ReadonlySet<string>;
  tieBreakSeed?: number;
};

export const mergeSimilarReleaseShuffleExclusions = (
  previousExclusions: ReadonlySet<string>,
  visibleBatch: readonly DiscogsRelease[],
): Set<string> => {
  const next = new Set(previousExclusions);

  for (const release of visibleBatch) {
    next.add(release.instance_id);
  }

  return next;
};

export const getSimilarReleaseBatch = ({
  releases,
  sourceRelease,
  limit,
  excludedInstanceIds,
  tieBreakSeed,
}: SimilarReleaseShuffleContext): DiscogsRelease[] =>
  getSimilarReleases({
    releases,
    sourceRelease,
    limit,
    ...(excludedInstanceIds.size > 0
      ? { excludeInstanceIds: excludedInstanceIds }
      : {}),
    ...(tieBreakSeed !== undefined && tieBreakSeed > 0 ? { tieBreakSeed } : {}),
  });

export const canShuffleSimilarReleaseBatch = ({
  releases,
  sourceRelease,
  limit: _batchLimit,
  excludedInstanceIds,
  visibleBatch,
}: SimilarReleaseShuffleContext & {
  visibleBatch: readonly DiscogsRelease[];
}): boolean => {
  if (visibleBatch.length === 0) {
    return false;
  }

  const nextExclusions = mergeSimilarReleaseShuffleExclusions(
    excludedInstanceIds,
    visibleBatch,
  );
  const hasMore = getSimilarReleaseBatch({
    releases,
    sourceRelease,
    limit: 1,
    excludedInstanceIds: nextExclusions,
  }).length;

  if (hasMore > 0) {
    return true;
  }

  void _batchLimit;

  return visibleBatch.length > 1;
};

export const planSimilarReleaseShuffle = ({
  releases,
  sourceRelease,
  limit,
  excludedInstanceIds,
  tieBreakSeed = 0,
  visibleBatch,
}: SimilarReleaseShuffleContext & {
  visibleBatch: readonly DiscogsRelease[];
}): {
  nextExcludedInstanceIds: Set<string>;
  nextShuffleSeed: number;
  nextBatch: DiscogsRelease[];
  resetsExclusions: boolean;
} => {
  const nextShuffleSeed = tieBreakSeed + 1;
  const nextExcludedInstanceIds = mergeSimilarReleaseShuffleExclusions(
    excludedInstanceIds,
    visibleBatch,
  );

  const nextBatch = getSimilarReleaseBatch({
    releases,
    sourceRelease,
    limit,
    excludedInstanceIds: nextExcludedInstanceIds,
    tieBreakSeed: nextShuffleSeed,
  });

  if (nextBatch.length > 0) {
    return {
      nextExcludedInstanceIds,
      nextShuffleSeed,
      nextBatch,
      resetsExclusions: false,
    };
  }

  return {
    nextExcludedInstanceIds: new Set(),
    nextShuffleSeed,
    nextBatch: getSimilarReleaseBatch({
      releases,
      sourceRelease,
      limit,
      excludedInstanceIds: new Set(),
      tieBreakSeed: nextShuffleSeed,
    }),
    resetsExclusions: true,
  };
};
