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
  RELEASE_SIMILAR_SHUFFLE_ARIA_LABEL,
  RELEASE_SIMILAR_SHUFFLE_LABEL,
  RELEASE_SIMILAR_SHUFFLE_TOOLTIP,
  RELEASE_SIMILAR_SIDEBAR_SUBTITLE,
  RELEASE_SIMILAR_SIDEBAR_TITLE,
} from "src/constants/releaseSimilarSidebar.constants";
import DiceIcon from "src/styles/icons/dice-thin.svg";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseSimilarSidebar.module.css";

interface ReleaseSimilarSidebarShuffleControlProps {
  canShuffle: boolean;
  onShuffle: () => void;
}

const ReleaseSimilarSidebarShuffleControl = ({
  canShuffle,
  onShuffle,
}: ReleaseSimilarSidebarShuffleControlProps) => (
  <Tooltip.Root>
    <Tooltip.Trigger
      render={
        <IconButton
          type="button"
          className={classNames(
            segmentedStyles.segment,
            styles.sidebarSegment,
            {
              [styles.shuffleSegmentDisabled]: !canShuffle,
            },
          )}
          iconClassName={styles.segmentIcon}
          label={RELEASE_SIMILAR_SHUFFLE_LABEL}
          data-testid="fmdReleaseSimilarSidebarShuffle"
          aria-label={RELEASE_SIMILAR_SHUFFLE_ARIA_LABEL}
          disabled={!canShuffle}
          onClick={onShuffle}
        >
          <DiceIcon aria-hidden />
        </IconButton>
      }
    />
    <Tooltip.Portal>
      <Tooltip.Positioner
        align="end"
        className={styles.shuffleTooltipPositioner}
        side="top"
      >
        <Tooltip.Popup className={styles.shuffleTooltipPopup}>
          {RELEASE_SIMILAR_SHUFFLE_TOOLTIP}
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
);

interface ReleaseSimilarSidebarProps {
  similarReleases: DiscogsRelease[];
  totalSimilarMatchCount?: number;
  isLoading?: boolean;
  canShuffleSimilarReleases?: boolean;
  onShuffleSimilarReleases?: () => void;
  onReleaseClick?: (instanceId: string) => void;
  variant?: "aside" | "inline";
}

export const ReleaseSimilarSidebar = ({
  similarReleases,
  totalSimilarMatchCount = similarReleases.length,
  isLoading = false,
  canShuffleSimilarReleases = false,
  onShuffleSimilarReleases,
  onReleaseClick,
  variant = "aside",
}: ReleaseSimilarSidebarProps) => {
  if (!isLoading && similarReleases.length === 0) {
    return null;
  }

  const Root = variant === "inline" ? "section" : "aside";
  const showActionsToolbar = !isLoading && similarReleases.length > 0;

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
                <span
                  className={classNames(
                    segmentedStyles.segment,
                    styles.sidebarSegment,
                    styles.similarCountSegment,
                  )}
                  data-testid="fmdReleaseSimilarSidebarCount"
                >
                  {formatSimilarReleaseCountLabel(totalSimilarMatchCount)}
                </span>
                {onShuffleSimilarReleases ? (
                  <ReleaseSimilarSidebarShuffleControl
                    canShuffle={canShuffleSimilarReleases}
                    onShuffle={onShuffleSimilarReleases}
                  />
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
