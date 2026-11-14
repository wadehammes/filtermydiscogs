import { DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { useSimilarReleasesInCollection } from "./useSimilarReleasesInCollection.hook";

export const useReleaseModalSimilarSection = (
  release: DiscogsRelease | null,
  isOpen: boolean,
  onReleaseClick?: (instanceId: string) => void,
) => {
  const {
    similarReleases,
    totalSimilarMatchCount,
    similarPageCount,
    similarPageIndex,
    isSimilarLoading,
    canHaveSimilar,
    canGoSimilarPagePrev,
    canGoSimilarPageNext,
    goSimilarPagePrev,
    goSimilarPageNext,
  } = useSimilarReleasesInCollection(release, isOpen);
  const showSimilarSection =
    canHaveSimilar && (isSimilarLoading || similarReleases.length > 0);
  const isDesktop = useMediaQuery(DESKTOP_LAYOUT_MEDIA_QUERY);
  const showAsideSimilar = showSimilarSection && isDesktop;
  const showInlineSimilar = showSimilarSection && !isDesktop;

  const similarSidebarShellProps = {
    similarReleases,
    totalSimilarMatchCount,
    similarPageCount,
    similarPageIndex,
    canGoSimilarPagePrev,
    canGoSimilarPageNext,
    ...definedProps({
      onReleaseClick,
      onSimilarPagePrev: goSimilarPagePrev,
      onSimilarPageNext: goSimilarPageNext,
    }),
  };

  return {
    showSimilarSection,
    showAsideSimilar,
    showInlineSimilar,
    isSimilarLoading,
    similarSidebarShellProps,
  };
};
