"use client";

import classNames from "classnames";
import { useId } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import {
  COLLECTION_RADIO_PLAY_TOOLTIP,
  COLLECTION_RADIO_PREPARING_LABEL,
  COLLECTION_RADIO_QUEUE_BUILDING_LABEL,
} from "src/constants/collectionRadio.constants";
import { useReleasePlaybackActions } from "src/context/releasePlayback.context";
import { useCollectionRadioPlayback } from "src/hooks/useCollectionRadioPlayback.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import { shouldShowCollectionRadioPlayButton } from "src/utils/collectionRadioPlayback";
import styles from "./CollectionRadioPlayButton.module.css";

export const CollectionRadioPlayButton = () => {
  const tooltipId = useId();
  const { hasActiveFilters, matchingView } = useFilterViews();
  const { togglePlayback } = useReleasePlaybackActions();
  const {
    startCollectionRadio,
    isStarting,
    isPrefetching,
    isDetailsReady,
    filteredReleaseCount,
    isCollectionRadioActive,
  } = useCollectionRadioPlayback();

  const isVisible = shouldShowCollectionRadioPlayButton({
    hasActiveFilters,
    matchingViewActive: matchingView !== null,
  });

  if (!isVisible) {
    return null;
  }

  const isWarmingUp = isPrefetching && !isDetailsReady;
  const isBlocked = isStarting || filteredReleaseCount === 0 || !isDetailsReady;
  const useNativeDisabled = isStarting || filteredReleaseCount === 0;
  const playControlLabel = isStarting
    ? COLLECTION_RADIO_QUEUE_BUILDING_LABEL
    : isWarmingUp
      ? COLLECTION_RADIO_PREPARING_LABEL
      : isCollectionRadioActive
        ? "Pause collection radio"
        : "Play collection radio";

  return (
    <div className={styles.tooltipAnchor}>
      <button
        type="button"
        className={classNames(styles.playTrigger, {
          [styles.playTriggerActive]: isCollectionRadioActive,
        })}
        aria-describedby={tooltipId}
        aria-label={playControlLabel}
        aria-busy={isStarting || isWarmingUp}
        aria-pressed={isCollectionRadioActive && !isStarting}
        aria-disabled={isBlocked || undefined}
        disabled={useNativeDisabled}
        data-testid="fmdCollectionRadioPlayButton"
        onClick={() => {
          if (isBlocked) {
            return;
          }

          if (isCollectionRadioActive) {
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
            {isCollectionRadioActive ? <PauseIcon /> : <PlayIcon />}
          </span>
        )}
      </button>
      <div
        id={tooltipId}
        role="tooltip"
        className={styles.tooltipBubble}
        data-testid="fmdCollectionRadioPlayTooltip"
      >
        {COLLECTION_RADIO_PLAY_TOOLTIP}
      </div>
    </div>
  );
};
