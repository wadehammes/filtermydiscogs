"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import {
  formatSimilarReleaseCountLabel,
  getSimilarReleasePageDigitCh,
  RELEASE_SIMILAR_COUNT_TOOLTIP,
  RELEASE_SIMILAR_PAGE_NEXT_ARIA_LABEL,
  RELEASE_SIMILAR_PAGE_PREV_ARIA_LABEL,
  RELEASE_SIMILAR_SIDEBAR_SUBTITLE,
  RELEASE_SIMILAR_SIDEBAR_TITLE,
} from "src/constants/releaseSimilarSidebar.constants";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";

const ReleaseSimilarSidebarCountSegment = ({
  totalSimilarMatchCount,
}: {
  totalSimilarMatchCount: number;
}) => (
  <Tooltip.Root>
    <Tooltip.Trigger
      className={classNames(
        segmentedStyles.segment,
        styles.sidebarSegment,
        styles.similarCountSegment,
      )}
      data-testid="fmdReleaseSimilarSidebarCount"
    >
      {formatSimilarReleaseCountLabel(totalSimilarMatchCount)}
    </Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Positioner
        align="start"
        className={styles.countTooltipPositioner}
        side="top"
      >
        <Tooltip.Popup className={styles.countTooltipPopup}>
          {RELEASE_SIMILAR_COUNT_TOOLTIP}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
);

interface ReleaseSimilarSidebarProps {
  similarReleases: DiscogsRelease[];
  totalSimilarMatchCount?: number;
  similarPageCount?: number;
  similarPageIndex?: number;
  isLoading?: boolean;
  canGoSimilarPagePrev?: boolean;
  canGoSimilarPageNext?: boolean;
  onSimilarPagePrev?: () => void;
  onSimilarPageNext?: () => void;
  onReleaseClick?: (instanceId: string) => void;
  variant?: "aside" | "inline";
}

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
  if (!isLoading && similarReleases.length === 0) {
    return null;
  }

  const Root = variant === "inline" ? "section" : "aside";
  const showActionsToolbar = !isLoading && similarReleases.length > 0;
  const showSimilarPagination =
    similarPageCount > 1 && Boolean(onSimilarPagePrev && onSimilarPageNext);

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
        {showActionsToolbar ? (
          <Tooltip.Provider closeDelay={80} delay={250}>
            <div className={styles.sidebarActions}>
              <SegmentedControl
                allowOverflow
                legend="Similar releases"
                className={styles.sidebarActionControl}
              >
                <ReleaseSimilarSidebarCountSegment
                  totalSimilarMatchCount={totalSimilarMatchCount}
                />
                {showSimilarPagination ? (
                  <>
                    <IconButton
                      type="button"
                      className={classNames(
                        segmentedStyles.segment,
                        styles.sidebarSegment,
                        styles.pageNavSegment,
                        styles.pageNavPrevButton,
                        {
                          [styles.pageNavSegmentDisabled]:
                            !canGoSimilarPagePrev,
                        },
                      )}
                      iconClassName={classNames(
                        styles.segmentIcon,
                        styles.pageChevronPrevious,
                      )}
                      data-testid="fmdReleaseSimilarSidebarPrev"
                      aria-label={RELEASE_SIMILAR_PAGE_PREV_ARIA_LABEL}
                      disabled={!canGoSimilarPagePrev}
                      onClick={onSimilarPagePrev}
                    >
                      <ChevronRightThinIcon aria-hidden />
                    </IconButton>
                    <span
                      className={classNames(
                        segmentedStyles.segment,
                        styles.sidebarSegment,
                        styles.similarPageSegment,
                      )}
                      data-testid="fmdReleaseSimilarSidebarPage"
                      style={{
                        ["--similar-page-digit-ch" as string]: `${getSimilarReleasePageDigitCh(similarPageCount)}ch`,
                      }}
                    >
                      <span className={styles.similarPageNumber}>
                        {similarPageIndex + 1}
                      </span>
                      <span className={styles.similarPageOf}> of </span>
                      <span className={styles.similarPageTotal}>
                        {similarPageCount}
                      </span>
                    </span>
                    <IconButton
                      type="button"
                      className={classNames(
                        segmentedStyles.segment,
                        styles.sidebarSegment,
                        styles.pageNavSegment,
                        {
                          [styles.pageNavSegmentDisabled]:
                            !canGoSimilarPageNext,
                        },
                      )}
                      iconClassName={styles.segmentIcon}
                      data-testid="fmdReleaseSimilarSidebarNext"
                      aria-label={RELEASE_SIMILAR_PAGE_NEXT_ARIA_LABEL}
                      disabled={!canGoSimilarPageNext}
                      onClick={onSimilarPageNext}
                    >
                      <ChevronRightThinIcon aria-hidden />
                    </IconButton>
                  </>
                ) : null}
              </SegmentedControl>
            </div>
          </Tooltip.Provider>
        ) : null}
      </div>
      {isLoading ? (
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
