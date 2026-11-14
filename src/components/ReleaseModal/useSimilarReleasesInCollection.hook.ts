import { useDeferredValue, useEffect, useMemo, useRef } from "react";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import type { DiscogsRelease } from "src/types";
import { releaseHasSimilarMatchTags } from "src/utils/similarReleases";
import {
  getModalSimilarReleasesBatch,
  getModalSimilarReleasesPool,
  getSimilarReleasesSidebarLoading,
  getSimilarReleasesUnsettled,
  resolveSimilarAnchorRelease,
} from "./useSimilarReleasesInCollection.utils";
import {
  persistSimilarPageIndexForAnchor,
  useSimilarReleasesPageState,
} from "./useSimilarReleasesPageState.hook";

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

  const canHaveSimilar = release ? releaseHasSimilarMatchTags(release) : false;

  const similarAnchorRelease = resolveSimilarAnchorRelease(
    release,
    similarSourceKey,
    deferredSimilarSourceKey,
  );

  const computedSimilarModalPool = useMemo(() => {
    if (!similarAnchorRelease) {
      return null;
    }

    return getModalSimilarReleasesPool({
      release: similarAnchorRelease,
      releasesForSimilar,
    });
  }, [similarAnchorRelease, releasesForSimilar]);

  const similarModalPoolRef = useRef<{
    anchorKey: string;
    pool: NonNullable<typeof computedSimilarModalPool>;
  } | null>(null);

  if (computedSimilarModalPool && similarSourceKey) {
    similarModalPoolRef.current = {
      anchorKey: similarSourceKey,
      pool: computedSimilarModalPool,
    };
  }

  if (
    similarSourceKey &&
    similarModalPoolRef.current?.anchorKey !== similarSourceKey
  ) {
    similarModalPoolRef.current = null;
  }

  const similarModalPool =
    computedSimilarModalPool ??
    (similarSourceKey &&
    similarModalPoolRef.current?.anchorKey === similarSourceKey
      ? similarModalPoolRef.current.pool
      : null);

  const similarPageCount = similarModalPool?.pageCount ?? 0;
  const totalSimilarMatchCount = similarModalPool?.totalMatchCount ?? 0;

  const { similarPageIndex, goSimilarPagePrev, goSimilarPageNext } =
    useSimilarReleasesPageState(
      similarSourceKey,
      similarSourceKey,
      similarPageCount,
    );

  const releaseInstanceId = release ? String(release.instance_id) : "";
  const similarPageIndexRef = useRef(similarPageIndex);
  similarPageIndexRef.current = similarPageIndex;

  useEffect(() => {
    const anchorInstanceId = releaseInstanceId;

    return () => {
      persistSimilarPageIndexForAnchor(
        anchorInstanceId,
        similarPageIndexRef.current,
      );
    };
  }, [releaseInstanceId]);

  const similarReleases = useMemo(() => {
    if (!similarModalPool) {
      return EMPTY_SIMILAR_BATCH;
    }

    return getModalSimilarReleasesBatch(similarModalPool, similarPageIndex);
  }, [similarModalPool, similarPageIndex]);

  const canGoSimilarPagePrev = similarPageIndex > 0;
  const canGoSimilarPageNext = similarPageIndex < similarPageCount - 1;

  const unsettledParams = {
    enabled,
    release,
    canHaveSimilar,
    isCollectionLoading,
    similarSourceKey,
    deferredSimilarSourceKey,
    releasesForSimilar,
    allReleases,
  };

  const isSimilarUnsettled = getSimilarReleasesUnsettled(unsettledParams);
  const isSimilarLoading = getSimilarReleasesSidebarLoading({
    ...unsettledParams,
    similarModalPool,
  });

  return {
    similarReleases,
    totalSimilarMatchCount,
    similarPageCount,
    similarPageIndex,
    isSimilarUnsettled,
    isSimilarLoading,
    canHaveSimilar,
    canGoSimilarPagePrev,
    canGoSimilarPageNext,
    goSimilarPagePrev,
    goSimilarPageNext,
  };
};
