import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

const INITIAL_VISIBLE_RELEASES = 100;
const VISIBLE_BATCH_SIZE = 100;
const INFINITE_SCROLL_ROOT_MARGIN = "0px 0px 750px 0px";

interface UseReleasesVisibleWindowParams {
  scrollElement: HTMLElement | null | undefined;
  gridSourceLength: number;
  isRandomMode: boolean;
  visibleCountResetKey: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  hasReleases: boolean;
}

export const useReleasesVisibleWindow = ({
  scrollElement,
  gridSourceLength,
  isRandomMode,
  visibleCountResetKey,
  hasNextPage,
  isFetchingNextPage,
  hasReleases,
}: UseReleasesVisibleWindowParams) => {
  const [showAllLoadedMessage, setShowAllLoadedMessage] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RELEASES);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: INFINITE_SCROLL_ROOT_MARGIN,
    root: scrollElement,
  });

  const hasMoreVisible = !isRandomMode && gridSourceLength > visibleCount;

  const visibleCountCap = isRandomMode
    ? gridSourceLength
    : Math.min(visibleCount, gridSourceLength);

  useEffect(() => {
    const allLoaded = !(hasNextPage || isFetchingNextPage) && hasReleases;
    let timeout: NodeJS.Timeout | undefined;

    if (allLoaded) {
      setShowAllLoadedMessage(true);
      timeout = setTimeout(() => {
        setShowAllLoadedMessage(false);
      }, 3000);
    } else {
      setShowAllLoadedMessage(false);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [hasNextPage, isFetchingNextPage, hasReleases]);

  useEffect(() => {
    if (inView && hasMoreVisible) {
      setVisibleCount((prev) => prev + VISIBLE_BATCH_SIZE);
    }
  }, [inView, hasMoreVisible]);

  useEffect(() => {
    void visibleCountResetKey;
    setVisibleCount(INITIAL_VISIBLE_RELEASES);
  }, [visibleCountResetKey]);

  return {
    infiniteScrollRef: ref,
    showAllLoadedMessage,
    visibleReleasesEndIndex: visibleCountCap,
  };
};

export const sliceVisibleReleases = <T>(
  releases: T[],
  endIndex: number,
  isRandomMode: boolean,
  isSearching: boolean,
  deferredReleases: T[],
): T[] => {
  const gridSourceReleases =
    isRandomMode || !isSearching ? releases : deferredReleases;

  if (!isRandomMode && gridSourceReleases.length > endIndex) {
    return gridSourceReleases.slice(0, endIndex);
  }

  return gridSourceReleases;
};
