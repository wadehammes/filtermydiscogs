"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import type { RefObject } from "react";
import { ReleaseSimilarSidebarReleaseList } from "src/components/ReleaseSimilarSidebar/ReleaseSimilarSidebarReleaseList.component";
import {
  RELEASE_SIMILAR_SIDEBAR_SUBTITLE,
  RELEASE_SIMILAR_SIDEBAR_TITLE,
} from "src/constants/releaseSimilarSidebar.constants";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";
import { ReleaseSimilarSidebarPagination } from "./ReleaseSimilarSidebarPagination.component";
import type { getReleaseSimilarSidebarChrome } from "./releaseSimilarSidebarChrome.utils";

type ReleaseSimilarSidebarPanelProps = {
  variant: "aside" | "inline";
  chrome: ReturnType<typeof getReleaseSimilarSidebarChrome>;
  similarReleases: DiscogsRelease[];
  totalSimilarMatchCount: number;
  similarPageCount: number;
  similarPageIndex: number;
  canGoSimilarPagePrev: boolean;
  canGoSimilarPageNext: boolean;
  listRef: RefObject<HTMLDivElement | null>;
  onSimilarPagePrev?: () => void;
  onSimilarPageNext?: () => void;
  onReleaseClick?: (instanceId: string) => void;
};

export const ReleaseSimilarSidebarPanel = ({
  variant,
  chrome,
  similarReleases,
  totalSimilarMatchCount,
  similarPageCount,
  similarPageIndex,
  canGoSimilarPagePrev,
  canGoSimilarPageNext,
  listRef,
  onSimilarPagePrev,
  onSimilarPageNext,
  onReleaseClick,
}: ReleaseSimilarSidebarPanelProps) => (
  <>
    <div
      className={styles.sidebarHeader}
      {...(variant === "inline"
        ? { "data-fmd-release-similar-scroll-target": "" }
        : {})}
    >
      <div className={styles.sidebarHeaderCopy}>
        <h3 className={styles.sidebarTitle}>{RELEASE_SIMILAR_SIDEBAR_TITLE}</h3>
        <p className={styles.sidebarSubtitle}>
          {RELEASE_SIMILAR_SIDEBAR_SUBTITLE}
        </p>
      </div>
    </div>
    {chrome.showActionsToolbar ? (
      <Tooltip.Provider closeDelay={80} delay={250}>
        <div
          className={classNames(
            styles.sidebarActions,
            variant === "inline" && styles.sidebarActionsInlineSticky,
          )}
        >
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
    <ReleaseSimilarSidebarReleaseList
      variant={variant}
      showListLoader={chrome.showListLoader}
      similarReleases={similarReleases}
      listRef={listRef}
      {...definedProps({ onReleaseClick })}
    />
  </>
);
