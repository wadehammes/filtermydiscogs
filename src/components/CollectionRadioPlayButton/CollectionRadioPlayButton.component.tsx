"use client";

import classNames from "classnames";
import { useId } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import {
  COLLECTION_RADIO_PLAY_TOOLTIP,
  COLLECTION_RADIO_PREPARING_LABEL,
  COLLECTION_RADIO_QUEUE_BUILDING_LABEL,
  COLLECTION_RADIO_RESTART_LABEL,
  COLLECTION_RADIO_RESTART_TOOLTIP,
} from "src/constants/collectionRadio.constants";
import { useReleasePlaybackActions } from "src/context/releasePlayback.context";
import { useCollectionRadioPlayback } from "src/hooks/useCollectionRadioPlayback.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import { shouldShowCollectionRadioPlayButton } from "src/utils/collectionRadioPlayback";
import { definedProps } from "src/utils/definedProps";
import styles from "./CollectionRadioPlayButton.module.css";

type CollectionRadioPlayButtonProps = {
  showLabel?: boolean;
};

export const CollectionRadioPlayButton = ({
  showLabel = false,
}: CollectionRadioPlayButtonProps) => {
  const tooltipId = useId();
  const { hasActiveFilters, matchingView } = useFilterViews();
  const { togglePlayback } = useReleasePlaybackActions();
  const {
    startCollectionRadio,
    isStarting,
    isPrefetching,
    isDetailsReady,
    filteredReleaseCount,
    isCollectionRadioSession,
    isCollectionRadioTransportPlaying,
    isCollectionRadioSelectionStale,
  } = useCollectionRadioPlayback();

  const isVisible = shouldShowCollectionRadioPlayButton({
    hasActiveFilters,
    matchingViewActive: matchingView !== null,
    matchingReleaseCount: filteredReleaseCount,
  });

  if (!isVisible) {
    return null;
  }

  const canResumeWithoutRestart =
    isCollectionRadioSession && !isCollectionRadioSelectionStale;
  const isWarmingUp =
    isPrefetching && !isDetailsReady && !canResumeWithoutRestart;
  const isBlocked =
    isStarting ||
    filteredReleaseCount === 0 ||
    !(isDetailsReady || canResumeWithoutRestart);
  const useNativeDisabled = isStarting || filteredReleaseCount === 0;
  const playControlLabel = isStarting
    ? COLLECTION_RADIO_QUEUE_BUILDING_LABEL
    : isWarmingUp
      ? COLLECTION_RADIO_PREPARING_LABEL
      : isCollectionRadioSelectionStale
        ? COLLECTION_RADIO_RESTART_LABEL
        : isCollectionRadioTransportPlaying
          ? "Pause collection radio"
          : isCollectionRadioSession
            ? "Resume collection radio"
            : "Play collection radio";
  const tooltipCopy = isCollectionRadioSelectionStale
    ? COLLECTION_RADIO_RESTART_TOOLTIP
    : COLLECTION_RADIO_PLAY_TOOLTIP;

  return (
    <div className={styles.tooltipAnchor}>
      <button
        type="button"
        className={classNames(styles.playTrigger, {
          [styles.playTriggerActive]: isCollectionRadioSession,
          [styles.playTriggerLabeled]: showLabel,
        })}
        {...definedProps({
          "aria-describedby": showLabel ? undefined : tooltipId,
          "aria-label": showLabel ? undefined : playControlLabel,
        })}
        aria-busy={isStarting || isWarmingUp}
        aria-pressed={
          isCollectionRadioTransportPlaying &&
          !isStarting &&
          !isCollectionRadioSelectionStale
        }
        aria-disabled={isBlocked || undefined}
        disabled={useNativeDisabled}
        data-testid="fmdCollectionRadioPlayButton"
        onClick={() => {
          if (isBlocked) {
            return;
          }

          if (canResumeWithoutRestart) {
            togglePlayback();
            return;
          }

          startCollectionRadio();
        }}
      >
        {isStarting || isWarmingUp ? (
          <Spinner
            size="sm"
            className={classNames(styles.transportIcon, styles.queueSpinner)}
            aria-label={
              isStarting
                ? COLLECTION_RADIO_QUEUE_BUILDING_LABEL
                : COLLECTION_RADIO_PREPARING_LABEL
            }
          />
        ) : (
          <span className={styles.transportIcon} aria-hidden>
            {isCollectionRadioTransportPlaying &&
            !isCollectionRadioSelectionStale ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </span>
        )}
        {showLabel ? (
          <span className={styles.playLabel}>{playControlLabel}</span>
        ) : null}
      </button>
      {showLabel ? null : (
        <div
          id={tooltipId}
          role="tooltip"
          className={styles.tooltipBubble}
          data-testid="fmdCollectionRadioPlayTooltip"
        >
          {tooltipCopy}
        </div>
      )}
    </div>
  );
};
