"use client";

import classNames from "classnames";
import { useRef } from "react";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";
import type { ReleaseSimilarSidebarProps } from "./ReleaseSimilarSidebar.types";
import { ReleaseSimilarSidebarPanel } from "./ReleaseSimilarSidebarPanel.component";
import {
  getReleaseSimilarSidebarChrome,
  shouldMountReleaseSimilarSidebar,
} from "./releaseSimilarSidebarChrome.utils";
import { useReleaseSimilarPaginationScroll } from "./useReleaseSimilarPaginationScroll.hook";

export const ReleaseSimilarSidebar = ({
  similarReleases,
  totalSimilarMatchCount = similarReleases.length,
  similarPageCount = 1,
  similarPageIndex = 0,
  isLoading = false,
  canGoSimilarPagePrev = false,
  canGoSimilarPageNext = false,
  onSimilarPagePrev,
  onSimilarPageNext,
  onReleaseClick,
  variant = "aside",
}: ReleaseSimilarSidebarProps) => {
  const rootRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useReleaseSimilarPaginationScroll({
    variant,
    isLoading,
    similarPageIndex,
    similarReleaseCount: similarReleases.length,
    sectionRef: rootRef,
    listRef,
  });

  if (!shouldMountReleaseSimilarSidebar(isLoading, similarReleases.length)) {
    return null;
  }

  const chrome = getReleaseSimilarSidebarChrome({
    isLoading,
    visibleReleaseCount: similarReleases.length,
    totalSimilarMatchCount,
    similarPageCount,
    hasPaginationHandlers: Boolean(onSimilarPagePrev && onSimilarPageNext),
  });

  const Root = variant === "inline" ? "section" : "aside";

  return (
    <Root
      ref={rootRef}
      className={classNames(
        variant === "inline" ? styles.sidebarInline : styles.sidebarAside,
      )}
      aria-label="Similar in your collection"
      data-testid="fmdReleaseSimilarSidebar"
    >
      <ReleaseSimilarSidebarPanel
        variant={variant}
        chrome={chrome}
        similarReleases={similarReleases}
        totalSimilarMatchCount={totalSimilarMatchCount}
        similarPageCount={similarPageCount}
        similarPageIndex={similarPageIndex}
        canGoSimilarPagePrev={canGoSimilarPagePrev}
        canGoSimilarPageNext={canGoSimilarPageNext}
        listRef={listRef}
        {...definedProps({
          onSimilarPagePrev,
          onSimilarPageNext,
          onReleaseClick,
        })}
      />
    </Root>
  );
};
