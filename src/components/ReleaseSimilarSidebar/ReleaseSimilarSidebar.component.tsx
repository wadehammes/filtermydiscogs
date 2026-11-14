"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import {
  RELEASE_SIMILAR_SIDEBAR_SUBTITLE,
  RELEASE_SIMILAR_SIDEBAR_TITLE,
} from "src/constants/releaseSimilarSidebar.constants";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";
import type { ReleaseSimilarSidebarProps } from "./ReleaseSimilarSidebar.types";
import { ReleaseSimilarSidebarPagination } from "./ReleaseSimilarSidebarPagination.component";
import {
  getReleaseSimilarSidebarChrome,
  shouldMountReleaseSimilarSidebar,
} from "./releaseSimilarSidebarChrome.utils";

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
      className={classNames(
        variant === "inline" ? styles.sidebarInline : styles.sidebarAside,
      )}
      aria-label="Similar in your collection"
      data-testid="fmdReleaseSimilarSidebar"
    >
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarHeaderCopy}>
          <h3 className={styles.sidebarTitle}>
            {RELEASE_SIMILAR_SIDEBAR_TITLE}
          </h3>
          <p className={styles.sidebarSubtitle}>
            {RELEASE_SIMILAR_SIDEBAR_SUBTITLE}
          </p>
        </div>
        {chrome.showActionsToolbar ? (
          <Tooltip.Provider closeDelay={80} delay={250}>
            <div className={styles.sidebarActions}>
              <ReleaseSimilarSidebarPagination
                totalSimilarMatchCount={totalSimilarMatchCount}
                similarPageCount={similarPageCount}
                similarPageIndex={similarPageIndex}
                canGoSimilarPagePrev={canGoSimilarPagePrev}
                canGoSimilarPageNext={canGoSimilarPageNext}
                {...definedProps({
                  onSimilarPagePrev,
                  onSimilarPageNext,
                })}
              />
            </div>
          </Tooltip.Provider>
        ) : null}
      </div>
      {chrome.showListLoader ? (
        <div
          className={styles.loadingState}
          data-testid="fmdReleaseSimilarSidebarLoading"
        >
          <PageLoader message="Loading similar releases..." />
        </div>
      ) : (
        <div
          className={classNames(
            styles.releasesList,
            variant === "inline"
              ? styles.releasesListInline
              : styles.releasesListAside,
          )}
        >
          {similarReleases.map((similarRelease) => (
            <ReleaseSimilarReleaseItem
              key={similarRelease.instance_id}
              release={similarRelease}
              {...definedProps({ onReleaseClick })}
            />
          ))}
        </div>
      )}
    </Root>
  );
};
