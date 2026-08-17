"use client";

import classNames from "classnames";
import { CheckThinIcon } from "src/components/shared/icons/CheckThinIcon.component";
import { ListPlusThinIcon } from "src/components/shared/icons/ListPlusThinIcon.component";
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
  isTrackPlayable?: (position: string) => boolean;
  isTrackQueued?: (position: string) => boolean;
  getPositionLabel?: (position: string) => string;
  hideTrackPosition?: boolean;
  reserveQueueColumn?: boolean;
  onTrackSelect?: (position: string) => void;
  onTrackQueue?: (position: string) => void;
  onActiveTrackToggle?: () => void;
}

export const ReleaseTracklist = ({
  tracks,
  releaseArtistNames,
  activeTrackPosition,
  showPlayingIndicatorOnActiveTrack = false,
  isPlaybackPaused = false,
  isTrackPlayable,
  isTrackQueued,
  getPositionLabel,
  hideTrackPosition = false,
  reserveQueueColumn = false,
  onTrackSelect,
  onTrackQueue,
  onActiveTrackToggle,
}: ReleaseTracklistProps) => {
  const hasSelectableTracks = onTrackSelect !== undefined;
  const showQueueColumn = onTrackQueue !== undefined || reserveQueueColumn;

  if (tracks.length === 0) {
    return (
      <p className={styles.emptyMessage} data-testid="fmdReleaseTracklistEmpty">
        No track listing available for this release.
      </p>
    );
  }

  return (
    <ol
      className={classNames(styles.tracklist, {
        [styles.tracklistNoPosition]: hideTrackPosition,
      })}
      data-testid="fmdReleaseTracklist"
    >
      {tracks.map((track) => {
        const canPlayTrack =
          hasSelectableTracks && (isTrackPlayable?.(track.position) ?? true);
        const isActive = canPlayTrack && track.position === activeTrackPosition;
        const isPlaying =
          canPlayTrack &&
          showPlayingIndicatorOnActiveTrack &&
          isActive &&
          onActiveTrackToggle;
        const isQueued = isTrackQueued?.(track.position) ?? false;
        const trackCreditsLine = formatTrackCreditsLine({
          track,
          releaseArtistNames,
        });
        const positionLabel =
          getPositionLabel?.(track.position) ?? track.position;

        const trackMainContent = (
          <>
            {hideTrackPosition ? null : (
              <span className={styles.trackPosition}>{positionLabel}</span>
            )}
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
          </>
        );

        return (
          <li
            key={`${track.position}-${track.title}`}
            className={classNames(styles.trackItem, {
              [styles.trackItemActive]: isActive,
              [styles.trackItemStatic]: !canPlayTrack,
            })}
          >
            {canPlayTrack ? (
              <button
                type="button"
                className={styles.trackMainButton}
                onClick={() => {
                  if (isPlaying && onActiveTrackToggle) {
                    onActiveTrackToggle();
                    return;
                  }

                  onTrackSelect?.(track.position);
                }}
                {...definedProps({
                  "aria-current": isActive ? ("true" as const) : undefined,
                })}
              >
                {trackMainContent}
              </button>
            ) : (
              <div className={styles.trackMainStatic}>{trackMainContent}</div>
            )}
            <div className={styles.trackTrailing}>
              {track.duration ? (
                <span className={styles.trackDuration}>{track.duration}</span>
              ) : null}
              {showQueueColumn ? (
                canPlayTrack && onTrackQueue ? (
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
                      <CheckThinIcon
                        className={styles.queueButtonIcon}
                        aria-hidden
                      />
                    ) : (
                      <ListPlusThinIcon
                        className={styles.queueButtonIcon}
                        aria-hidden
                      />
                    )}
                  </button>
                ) : (
                  <span className={styles.queueButtonSpacer} aria-hidden />
                )
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
};
