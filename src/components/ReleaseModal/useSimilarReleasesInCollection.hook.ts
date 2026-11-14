import { useCallback, useDeferredValue, useMemo, useRef } from "react";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import type { DiscogsRelease } from "src/types";
import { releaseHasSimilarMatchTags } from "src/utils/similarReleases";
import {
  getCanShuffleSimilarReleases,
  getModalSimilarReleasesSnapshot,
  isDeferredSimilarAnchorReady as isSimilarAnchorDeferredReady,
  planModalSimilarReleaseShuffle,
} from "./useSimilarReleasesInCollection.utils";
import { useSimilarReleasesShuffleState } from "./useSimilarReleasesShuffleState.hook";

const EMPTY_SIMILAR_BATCH: DiscogsRelease[] = [];

export const useSimilarReleasesInCollection = (
  release: DiscogsRelease | null,
  enabled = true,
) => {
  const allReleases = useAllReleases();
  const releasesForSimilar = useDeferredValue(allReleases);
  const similarSourceKey =
    enabled && release ? String(release.instance_id) : null;
  const deferredSimilarSourceKey = useDeferredValue(similarSourceKey);
  const { isLoading, hasNextPage, isFetchingNextPage } =
    useCollectionLoadState();
  const isCollectionLoading = useNeedsCollectionLoad({
    isLoading,
    hasNextPage,
    isFetchingNextPage,
  });
  const {
    excludedInstanceIds,
    shuffleSeed,
    shuffledSimilarReleases,
    applyShufflePlan,
  } = useSimilarReleasesShuffleState(
    deferredSimilarSourceKey,
    releasesForSimilar,
  );

  const canHaveSimilar = release ? releaseHasSimilarMatchTags(release) : false;

  const isDeferredSimilarAnchorReady = isSimilarAnchorDeferredReady(
    deferredSimilarSourceKey,
    release,
    isCollectionLoading,
  );

  const { computedSimilarReleases, totalSimilarMatchCount } = useMemo(() => {
    if (!isDeferredSimilarAnchorReady) {
      return {
        computedSimilarReleases: EMPTY_SIMILAR_BATCH,
        totalSimilarMatchCount: 0,
      };
    }

    const snapshot = getModalSimilarReleasesSnapshot({
      release,
      releasesForSimilar,
      excludedInstanceIds,
      shuffleSeed,
    });

    return {
      computedSimilarReleases: snapshot.batch,
      totalSimilarMatchCount: snapshot.totalMatchCount,
    };
  }, [
    excludedInstanceIds,
    isDeferredSimilarAnchorReady,
    release,
    releasesForSimilar,
    shuffleSeed,
  ]);

  const similarReleases = shuffledSimilarReleases ?? computedSimilarReleases;

  const similarReleasesRef = useRef(similarReleases);
  similarReleasesRef.current = similarReleases;

  const canShuffleSimilarReleases =
    isDeferredSimilarAnchorReady &&
    canHaveSimilar &&
    getCanShuffleSimilarReleases({
      release: release!,
      releasesForSimilar,
      excludedInstanceIds,
      similarReleases,
      totalSimilarMatchCount,
    });

  const shuffleSimilarReleases = useCallback(() => {
    if (!isDeferredSimilarAnchorReady) {
      return;
    }

    const plan = planModalSimilarReleaseShuffle({
      release: release!,
      releasesForSimilar,
      excludedInstanceIds,
      shuffleSeed,
      visibleBatch: similarReleasesRef.current,
    });

    applyShufflePlan(plan);
  }, [
    applyShufflePlan,
    excludedInstanceIds,
    isDeferredSimilarAnchorReady,
    release,
    releasesForSimilar,
    shuffleSeed,
  ]);

  const isSimilarLoading = Boolean(
    enabled && release && canHaveSimilar && isCollectionLoading,
  );

  return {
    similarReleases,
    totalSimilarMatchCount,
    isSimilarLoading,
    canHaveSimilar,
    canShuffleSimilarReleases,
    shuffleSimilarReleases,
  };
};
