import { type RefObject, useLayoutEffect, useRef } from "react";
import { shouldMountReleaseSimilarSidebar } from "src/components/ReleaseSimilarSidebar/releaseSimilarSidebarChrome.utils";
import {
  scrollReleaseSimilarListToTop,
  scrollReleaseSimilarSectionToStart,
} from "src/components/ReleaseSimilarSidebar/releaseSimilarSidebarScroll.utils";

export const useReleaseSimilarPaginationScroll = ({
  variant,
  isLoading,
  similarPageIndex,
  similarReleaseCount,
  sectionRef,
  listRef,
}: {
  variant: "aside" | "inline";
  isLoading: boolean;
  similarPageIndex: number;
  similarReleaseCount: number;
  sectionRef: RefObject<HTMLElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
}): void => {
  const lastPaginatedScrollIndexRef = useRef(similarPageIndex);

  useLayoutEffect(() => {
    if (!shouldMountReleaseSimilarSidebar(isLoading, similarReleaseCount)) {
      return;
    }

    if (lastPaginatedScrollIndexRef.current === similarPageIndex) {
      return;
    }

    lastPaginatedScrollIndexRef.current = similarPageIndex;

    if (variant === "aside") {
      scrollReleaseSimilarListToTop(listRef.current);
      return;
    }

    const sectionRoot = sectionRef.current;

    if (sectionRoot) {
      scrollReleaseSimilarSectionToStart(sectionRoot);
    }
  }, [
    isLoading,
    listRef,
    sectionRef,
    similarPageIndex,
    similarReleaseCount,
    variant,
  ]);
};
