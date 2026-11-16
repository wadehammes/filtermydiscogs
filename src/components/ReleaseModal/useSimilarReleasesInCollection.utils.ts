import { RELEASE_MODAL_SIMILAR_LIMIT } from "src/constants/collection";
import type { DiscogsRelease } from "src/types";
import {
  buildSimilarReleasesModalPool,
  type SimilarReleasesModalPool,
  sliceSimilarReleasesModalBatch,
} from "src/utils/similarReleases";

export const isDeferredSimilarAnchorReady = (
  deferredSimilarSourceKey: string | null,
  release: DiscogsRelease | null,
): release is DiscogsRelease =>
  Boolean(
    deferredSimilarSourceKey &&
      release &&
      String(release.instance_id) === deferredSimilarSourceKey,
  );

export const resolveSimilarAnchorRelease = (
  release: DiscogsRelease | null,
  similarSourceKey: string | null,
  deferredSimilarSourceKey: string | null,
): DiscogsRelease | null => {
  if (
    release &&
    similarSourceKey &&
    String(release.instance_id) === similarSourceKey
  ) {
    return release;
  }

  return isDeferredSimilarAnchorReady(deferredSimilarSourceKey, release)
    ? release
    : null;
};

export const getSimilarReleasesUnsettled = ({
  enabled,
  release,
  canHaveSimilar,
  isCollectionLoading,
  similarSourceKey,
  deferredSimilarSourceKey,
  releasesForSimilar,
  allReleases,
}: {
  enabled: boolean;
  release: DiscogsRelease | null;
  canHaveSimilar: boolean;
  isCollectionLoading: boolean;
  similarSourceKey: string | null;
  deferredSimilarSourceKey: string | null;
  releasesForSimilar: DiscogsRelease[];
  allReleases: DiscogsRelease[];
}): boolean =>
  Boolean(
    enabled &&
      release &&
      canHaveSimilar &&
      (isCollectionLoading ||
        (similarSourceKey !== null &&
          similarSourceKey !== deferredSimilarSourceKey) ||
        releasesForSimilar !== allReleases),
  );

export const getSimilarReleasesSidebarLoading = ({
  similarModalPool,
  ...unsettledParams
}: {
  enabled: boolean;
  release: DiscogsRelease | null;
  canHaveSimilar: boolean;
  isCollectionLoading: boolean;
  similarSourceKey: string | null;
  deferredSimilarSourceKey: string | null;
  releasesForSimilar: DiscogsRelease[];
  allReleases: DiscogsRelease[];
  similarModalPool: SimilarReleasesModalPool | null;
}): boolean => {
  if (!getSimilarReleasesUnsettled(unsettledParams)) {
    return false;
  }

  return similarModalPool == null || similarModalPool.totalMatchCount === 0;
};

export const getModalSimilarReleasesPool = ({
  release,
  releasesForSimilar,
}: {
  release: DiscogsRelease;
  releasesForSimilar: DiscogsRelease[];
}): SimilarReleasesModalPool =>
  buildSimilarReleasesModalPool({
    releases: releasesForSimilar,
    sourceRelease: release,
    batchLimit: RELEASE_MODAL_SIMILAR_LIMIT,
  });

export const getModalSimilarReleasesBatch = (
  pool: SimilarReleasesModalPool,
  pageIndex: number,
): DiscogsRelease[] =>
  sliceSimilarReleasesModalBatch(pool, RELEASE_MODAL_SIMILAR_LIMIT, pageIndex);

export type SimilarModalPoolCache = {
  anchorKey: string;
  pool: SimilarReleasesModalPool;
} | null;

export const resolveStableSimilarModalPool = ({
  similarSourceKey,
  computedPool,
  cache,
}: {
  similarSourceKey: string | null;
  computedPool: SimilarReleasesModalPool | null;
  cache: SimilarModalPoolCache;
}): {
  cache: SimilarModalPoolCache;
  similarModalPool: SimilarReleasesModalPool | null;
} => {
  let nextCache =
    similarSourceKey && cache?.anchorKey !== similarSourceKey ? null : cache;

  if (computedPool && similarSourceKey) {
    nextCache = { anchorKey: similarSourceKey, pool: computedPool };
  }

  const similarModalPool =
    computedPool ??
    (similarSourceKey && nextCache?.anchorKey === similarSourceKey
      ? nextCache.pool
      : null);

  return { cache: nextCache, similarModalPool };
};
