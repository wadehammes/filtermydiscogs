"use client";

import { IconButton } from "src/components/IconButton/IconButton.component";
import { useCollectionRadioPlayback } from "src/hooks/useCollectionRadioPlayback.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import PlayIcon from "src/styles/icons/play-thin.svg";
import { shouldShowCollectionRadioPlayButton } from "src/utils/collectionRadioPlayback";
import styles from "./CollectionRadioPlayButton.module.css";

export const CollectionRadioPlayButton = () => {
  const { hasActiveFilters, matchingView } = useFilterViews();
  const { startCollectionRadio, isStarting, filteredReleaseCount } =
    useCollectionRadioPlayback();

  const isVisible = shouldShowCollectionRadioPlayButton({
    hasActiveFilters,
    matchingViewActive: matchingView !== null,
  });

  if (!isVisible) {
    return null;
  }

  const isDisabled = isStarting || filteredReleaseCount === 0;

  return (
    <div className={styles.gradientRing}>
      <IconButton
        variant="default"
        className={styles.playButton}
        iconClassName={styles.playIcon}
        aria-label="Play collection radio"
        disabled={isDisabled}
        data-testid="fmdCollectionRadioPlayButton"
        onClick={() => {
          void startCollectionRadio();
        }}
      >
        <PlayIcon aria-hidden />
      </IconButton>
    </div>
  );
};
