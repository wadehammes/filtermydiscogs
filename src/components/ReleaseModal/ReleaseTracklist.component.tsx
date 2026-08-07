"use client";

import classNames from "classnames";
import CheckIcon from "src/styles/icons/check-thin.svg";
import ListIcon from "src/styles/icons/list-thin.svg";
import type { DiscogsTrack } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { formatTrackCreditsLine } from "src/utils/releaseDisplay";
import { PlayingIndicator } from "./PlayingIndicator.component";
import styles from "./ReleaseTracklist.module.css";

interface ReleaseTracklistProps {
  tracks: DiscogsTrack[];
  releaseArtistNames: string;
  activeTrackPosition: string | null;
  showPlayingIndicatorOnActiveTrack?: boolean;
  isPlaybackPaused?: boolean;
  isTrackQueued?: (position: string) => boolean;
  onTrackSelect: (position: string) => void;
  onTrackQueue?: (position: string) => void;
  onActiveTrackToggle?: () => void;
}

export const ReleaseTracklist = ({
  tracks,
  releaseArtistNames,
  activeTrackPosition,
  showPlayingIndicatorOnActiveTrack = false,
  isPlaybackPaused = false,
  isTrackQueued,
  onTrackSelect,
  onTrackQueue,
  onActiveTrackToggle,
}: ReleaseTracklistProps) => {
  if (tracks.length === 0) {
    return (
      <p className={styles.emptyMessage} data-testid="fmdReleaseTracklistEmpty">
        No track listing available for this release.
      </p>
    );
  }

  return (
    <ol className={styles.tracklist} data-testid="fmdReleaseTracklist">
      {tracks.map((track) => {
        const isActive = track.position === activeTrackPosition;
        const isPlaying =
          showPlayingIndicatorOnActiveTrack && isActive && onActiveTrackToggle;
        const isQueued = isTrackQueued?.(track.position) ?? false;
        const trackCreditsLine = formatTrackCreditsLine({
          track,
          releaseArtistNames,
        });

        return (
          <li
            key={`${track.position}-${track.title}`}
            className={classNames(styles.trackItem, {
              [styles.trackItemActive]: isActive,
            })}
          >
            <button
              type="button"
              className={styles.trackMainButton}
              onClick={() => {
                if (isPlaying && onActiveTrackToggle) {
                  onActiveTrackToggle();
                  return;
                }

                onTrackSelect(track.position);
              }}
              {...definedProps({
                "aria-current": isActive ? ("true" as const) : undefined,
              })}
            >
              <span className={styles.trackPosition}>{track.position}</span>
              <span className={styles.trackTitle}>
                {isPlaying ? (
                  <PlayingIndicator isPaused={isPlaybackPaused} />
                ) : null}
                <span className={styles.trackTitleStack}>
                  <span className={styles.trackTitleText}>{track.title}</span>
                  {trackCreditsLine ? (
                    <span className={styles.trackCredits}>
                      {trackCreditsLine}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
            <div className={styles.trackTrailing}>
              {track.duration ? (
                <span className={styles.trackDuration}>{track.duration}</span>
              ) : null}
              {onTrackQueue ? (
                <button
                  type="button"
                  className={classNames(styles.queueButton, {
                    [styles.queueButtonQueued]: isQueued,
                  })}
                  onClick={() => {
                    onTrackQueue(track.position);
                  }}
                  disabled={isQueued}
                  aria-label={
                    isQueued
                      ? `${track.title} is already in the queue`
                      : `Add ${track.title} to queue`
                  }
                  title={isQueued ? "In queue" : "Add to queue"}
                  data-testid="fmdReleaseTrackQueueButton"
                >
                  {isQueued ? (
                    <CheckIcon className={styles.queueButtonIcon} aria-hidden />
                  ) : (
                    <ListIcon className={styles.queueButtonIcon} aria-hidden />
                  )}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
