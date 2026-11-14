import { useCallback, useEffect, useState } from "react";
import type { DiscogsRelease } from "src/types";
import type { planSimilarReleaseShuffle } from "src/utils/similarReleasesShuffle";

type SimilarReleaseShufflePlan = ReturnType<typeof planSimilarReleaseShuffle>;

export const useSimilarReleasesShuffleState = (
  deferredSimilarSourceKey: string | null,
  releasesForSimilar: DiscogsRelease[],
) => {
  const [excludedInstanceIds, setExcludedInstanceIds] = useState(
    () => new Set<string>(),
  );
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [shuffledSimilarReleases, setShuffledSimilarReleases] = useState<
    DiscogsRelease[] | null
  >(null);

  useEffect(() => {
    void deferredSimilarSourceKey;
    setExcludedInstanceIds(new Set());
    setShuffleSeed(0);
    setShuffledSimilarReleases(null);
  }, [deferredSimilarSourceKey]);

  useEffect(() => {
    void releasesForSimilar;
    setShuffledSimilarReleases(null);
  }, [releasesForSimilar]);

  const applyShufflePlan = useCallback((plan: SimilarReleaseShufflePlan) => {
    setExcludedInstanceIds(plan.nextExcludedInstanceIds);
    setShuffleSeed(plan.nextShuffleSeed);
    setShuffledSimilarReleases(plan.nextBatch);
  }, []);

  return {
    excludedInstanceIds,
    shuffleSeed,
    shuffledSimilarReleases,
    applyShufflePlan,
  };
};
