"use client";

import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import {
  getSimilarReleasePageDigitCh,
  RELEASE_SIMILAR_PAGE_NEXT_ARIA_LABEL,
  RELEASE_SIMILAR_PAGE_PREV_ARIA_LABEL,
} from "src/constants/releaseSimilarSidebar.constants";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import styles from "./ReleaseSimilarSidebar.module.css";
import { ReleaseSimilarSidebarCountSegment } from "./ReleaseSimilarSidebarCountSegment.component";

type ReleaseSimilarSidebarPaginationProps = {
  totalSimilarMatchCount: number;
  similarPageCount: number;
  similarPageIndex: number;
  canGoSimilarPagePrev: boolean;
  canGoSimilarPageNext: boolean;
  onSimilarPagePrev?: () => void;
  onSimilarPageNext?: () => void;
};

export const ReleaseSimilarSidebarPagination = ({
  totalSimilarMatchCount,
  similarPageCount,
  similarPageIndex,
  canGoSimilarPagePrev,
  canGoSimilarPageNext,
  onSimilarPagePrev,
  onSimilarPageNext,
}: ReleaseSimilarSidebarPaginationProps) => {
  const showSimilarPagination =
    similarPageCount > 1 && Boolean(onSimilarPagePrev && onSimilarPageNext);

  return (
    <SegmentedControl
      allowOverflow
      legend="Similar releases"
      className={styles.sidebarActionControl}
    >
      <ReleaseSimilarSidebarCountSegment
        totalSimilarMatchCount={totalSimilarMatchCount}
        showPaginationDivider={showSimilarPagination}
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
                [styles.pageNavSegmentDisabled]: !canGoSimilarPagePrev,
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
            <span className={styles.similarPageTotal}>{similarPageCount}</span>
          </span>
          <IconButton
            type="button"
            className={classNames(
              segmentedStyles.segment,
              styles.sidebarSegment,
              styles.pageNavSegment,
              {
                [styles.pageNavSegmentDisabled]: !canGoSimilarPageNext,
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
  );
};
