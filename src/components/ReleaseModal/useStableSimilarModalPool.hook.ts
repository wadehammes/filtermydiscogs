import { useMemo, useRef } from "react";
import type { DiscogsRelease } from "src/types";
import type { SimilarReleasesModalPool } from "src/utils/similarReleases";
import {
  getModalSimilarReleasesPool,
  resolveStableSimilarModalPool,
  type SimilarModalPoolCache,
} from "./useSimilarReleasesInCollection.utils";

export const useStableSimilarModalPool = (
  similarSourceKey: string | null,
  similarAnchorRelease: DiscogsRelease | null,
  releasesForSimilar: DiscogsRelease[],
): SimilarReleasesModalPool | null => {
  const computedSimilarModalPool = useMemo(() => {
    if (!similarAnchorRelease) {
      return null;
    }

    return getModalSimilarReleasesPool({
      release: similarAnchorRelease,
      releasesForSimilar,
    });
  }, [similarAnchorRelease, releasesForSimilar]);

  const cacheRef = useRef<SimilarModalPoolCache>(null);
  const resolved = resolveStableSimilarModalPool({
    similarSourceKey,
    computedPool: computedSimilarModalPool,
    cache: cacheRef.current,
  });

  cacheRef.current = resolved.cache;

  return resolved.similarModalPool;
};