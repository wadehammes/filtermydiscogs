import { useMemo } from "react";
import { SIMILAR_RELEASES_LIMIT } from "src/constants/collection";
import { useCollectionLoadState } from "src/hooks/useCollectionData.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useNeedsCollectionLoad } from "src/hooks/useNeedsCollectionLoad.hook";
import type { DiscogsRelease } from "src/types";
import { getSimilarReleases } from "src/utils/similarReleases";

const releaseCanHaveSimilarMatches = (release: DiscogsRelease): boolean => {
  const { genres, styles } = release.basic_information;

  return (genres?.length ?? 0) > 0 || (styles?.length ?? 0) > 0;
};

export const useSimilarReleasesInCollection = (
  release: DiscogsRelease | null,
  enabled = true,
) => {
  const allReleases = useAllReleases();
  const { isLoading, hasNextPage, isFetchingNextPage } =
    useCollectionLoadState();
  const isCollectionLoading = useNeedsCollectionLoad({
    isLoading,
    hasNextPage,
    isFetchingNextPage,
  });

  const canHaveSimilar = release
    ? releaseCanHaveSimilarMatches(release)
    : false;

  const similarReleases = useMemo(() => {
    if (!(enabled && release) || isCollectionLoading) {
      return [];
    }

    return getSimilarReleases({
      releases: allReleases,
      sourceRelease: release,
      limit: SIMILAR_RELEASES_LIMIT,
    });
  }, [allReleases, enabled, isCollectionLoading, release]);

  const isSimilarLoading = Boolean(
    enabled && release && canHaveSimilar && isCollectionLoading,
  );

  return {
    similarReleases,
    isSimilarLoading,
    canHaveSimilar,
  };
};
