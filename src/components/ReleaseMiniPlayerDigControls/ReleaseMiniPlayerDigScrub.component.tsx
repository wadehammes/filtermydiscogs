"use client";

import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { PlaybackDockSlider } from "src/components/PlaybackDockSlider/PlaybackDockSlider.component";
import { COMPACT_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import {
  useReleasePlaybackActions,
  useReleasePlaybackEmbedProgressState,
} from "src/context/releasePlayback.context";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import { blurFocusWithinPlaybackDock } from "src/utils/playbackDockFocus";
import {
  PLAYBACK_DOCK_SEEK_SKIP_SECONDS,
  resolvePlaybackProgressSliderMax,
} from "src/utils/playbackEmbedProgress";
import { formatVideoDuration } from "src/utils/releasePlayback";
import styles from "./ReleaseMiniPlayerDigControls.module.css";

interface ReleaseMiniPlayerDigScrubProps {
  disabled?: boolean | undefined;
}

export const ReleaseMiniPlayerDigScrub = ({
  disabled = false,
}: ReleaseMiniPlayerDigScrubProps) => {
  "use memo";
  const { embedProgress } = useReleasePlaybackEmbedProgressState();
  const { seekPlayback } = useReleasePlaybackActions();
  const isCompactLayout = useMediaQuery(COMPACT_LAYOUT_MEDIA_QUERY);

  const [scrubValue, setScrubValue] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const progressMax = resolvePlaybackProgressSliderMax({
    currentTime: embedProgress?.currentTime ?? scrubValue,
    duration: embedProgress?.duration ?? null,
  });

  useEffect(() => {
    if (!isScrubbing && embedProgress) {
      setScrubValue(embedProgress.currentTime);
    }
  }, [embedProgress, isScrubbing]);

  const commitSeek = useCallback(
    (value: number) => {
      setIsScrubbing(false);
      setScrubValue(value);
      seekPlayback(value);

      if (isCompactLayout) {
        blurFocusWithinPlaybackDock();
      }
    },
    [isCompactLayout, seekPlayback],
  );

  const skipBySeconds = useCallback(
    (delta: number) => {
      const next = Math.max(0, scrubValue + delta);
      setScrubValue(next);
      seekPlayback(next);
    },
    [scrubValue, seekPlayback],
  );

  const elapsedLabel = formatVideoDuration(Math.floor(scrubValue)) ?? "0:00";
  const durationLabel =
    embedProgress?.duration !== null && embedProgress?.duration !== undefined
      ? (formatVideoDuration(Math.floor(embedProgress.duration)) ?? "")
      : null;

  return (
    <div className={styles.digScrub} data-testid="fmdReleaseMiniPlayerDigScrub">
      <div className={styles.progressGroup}>
        <div className={styles.skipCluster}>
          <button
            type="button"
            className={classNames(styles.skipButton, styles.skipBack)}
            disabled={disabled}
            onClick={() => {
              skipBySeconds(-PLAYBACK_DOCK_SEEK_SKIP_SECONDS);
            }}
          >
            −{PLAYBACK_DOCK_SEEK_SKIP_SECONDS}s
          </button>
          <button
            type="button"
            className={classNames(styles.skipButton, styles.skipForward)}
            disabled={disabled}
            onClick={() => {
              skipBySeconds(PLAYBACK_DOCK_SEEK_SKIP_SECONDS);
            }}
          >
            +{PLAYBACK_DOCK_SEEK_SKIP_SECONDS}s
          </button>
        </div>
        <PlaybackDockSlider
          ariaLabel="Playback position"
          className={styles.progressSlider}
          disabled={disabled}
          max={progressMax}
          min={0}
          onValueChange={(value) => {
            setIsScrubbing(true);
            setScrubValue(value);
          }}
          onValueCommitted={commitSeek}
          step={0.25}
          testId="fmdPlaybackDockProgressSlider"
          value={scrubValue}
        />
        <div
          className={styles.timeLabel}
          aria-live="polite"
          data-testid="fmdPlaybackDockTimeLabel"
        >
          <span>{elapsedLabel}</span>
          {durationLabel ? (
            <>
              <span aria-hidden className={styles.timeSep}>
                /
              </span>
              <span className={styles.timeDuration}>{durationLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
