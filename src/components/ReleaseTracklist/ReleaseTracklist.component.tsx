"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { PlayingIndicator } from "src/components/PlayingIndicator/PlayingIndicator.component";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import { ListThinIcon } from "src/styles/icons/ListThinIcon.component";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import type { DiscogsTrack } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { formatTrackCreditsLine } from "src/utils/releaseDisplay";
import {
  formatUserTrackListenLabel,
  type UserTrackStatCounts,
} from "src/utils/userTrack";
import styles from "./ReleaseTracklist.module.css";
import { ReleaseTracklistListenStat } from "./ReleaseTracklistListenStat.component";

interface ReleaseTracklistProps {
  tracks: DiscogsTrack[];
  releaseArtistNames: string;
  trackStatsByPosition?: Record<string, UserTrackStatCounts>;
  activeTrackPosition: string | null;
  showPlayingIndicatorOnActiveTrack?: boolean;
  isPlaybackPaused?: boolean;
  isTrackPlayable?: (position: string) => boolean;
  isTrackQueued?: (position: string) => boolean;
  isTrackUnqueueable?: (position: string) => boolean;
  getPositionLabel?: (position: string) => string;
  hideTrackPosition?: boolean;
  reserveQueueColumn?: boolean;
  onTrackSelect?: (position: string) => void;
  onTrackQueue?: (position: string) => void;
  onTrackUnqueue?: (position: string) => void;
  onAddAllToQueue?: () => void;
  onRemoveAllFromQueue?: () => void;
  allPlayableTracksQueued?: boolean;
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
  isTrackUnqueueable,
  getPositionLabel,
  hideTrackPosition = false,
  reserveQueueColumn = false,
  onTrackSelect,
  onTrackQueue,
  onTrackUnqueue,
  onAddAllToQueue,
  onRemoveAllFromQueue,
  allPlayableTracksQueued = false,
  onActiveTrackToggle,
  trackStatsByPosition,
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
    <div className={styles.tracklistPanel}>
      <Tooltip.Provider closeDelay={80} delay={250}>
        <ol
          className={classNames(styles.tracklist, {
            [styles.tracklistNoPosition]: hideTrackPosition,
          })}
          data-testid="fmdReleaseTracklist"
        >
          {tracks.map((track) => {
            const canPlayTrack =
              hasSelectableTracks &&
              (isTrackPlayable?.(track.position) ?? true);
            const isActive =
              canPlayTrack && track.position === activeTrackPosition;
            const isPlaying =
              canPlayTrack &&
              showPlayingIndicatorOnActiveTrack &&
              isActive &&
              onActiveTrackToggle;
            const isQueued = isTrackQueued?.(track.position) ?? false;
            const canUnqueue =
              isQueued &&
              onTrackUnqueue !== undefined &&
              (isTrackUnqueueable?.(track.position) ?? false);
            const canAddToQueue =
              onTrackQueue !== undefined &&
              (!isQueued || (isActive && !canUnqueue));
            const showQueueControl =
              canPlayTrack && (onTrackQueue !== undefined || canUnqueue);
            const trackCreditsLine = formatTrackCreditsLine({
              track,
              releaseArtistNames,
            });
            const positionLabel =
              getPositionLabel?.(track.position) ?? track.position;
            const trackStats = trackStatsByPosition?.[track.position];
            const trackStatsLabel = trackStats
              ? formatUserTrackListenLabel(trackStats)
              : null;

            const trackTitleContent = (
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
            );

            const trackMainContent = (
              <>
                {hideTrackPosition ? null : (
                  <span className={styles.trackPosition}>{positionLabel}</span>
                )}
                {trackTitleContent}
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
                  <div className={styles.trackMainStatic}>
                    {trackMainContent}
                  </div>
                )}
                <div className={styles.trackTrailing}>
                  {trackStats && trackStatsLabel ? (
                    <ReleaseTracklistListenStat
                      label={trackStatsLabel}
                      stats={trackStats}
                    />
                  ) : null}
                  {track.duration ? (
                    <span className={styles.trackDuration}>
                      {track.duration}
                    </span>
                  ) : null}
                  {showQueueColumn ? (
                    showQueueControl ? (
                      isQueued && canUnqueue ? (
                        <IconButton
                          variant="minus"
                          className={classNames(
                            styles.queueButton,
                            styles.queueButtonQueued,
                          )}
                          iconClassName={styles.queueButtonIcon}
                          onClick={() => {
                            onTrackUnqueue(track.position);
                          }}
                          aria-label={`Remove ${track.title} from queue`}
                          title="Remove from queue"
                          data-testid="fmdReleaseTrackQueueButton"
                        >
                          <span data-testid="fmdReleaseTrackQueueRemoveIcon">
                            <MinusIcon />
                          </span>
                        </IconButton>
                      ) : (
                        <IconButton
                          variant="queue"
                          className={classNames(styles.queueButton, {
                            [styles.queueButtonQueued]:
                              isQueued && !canAddToQueue,
                          })}
                          iconClassName={styles.queueButtonIcon}
                          onClick={() => {
                            onTrackQueue?.(track.position);
                          }}
                          disabled={!canAddToQueue}
                          aria-label={
                            canAddToQueue
                              ? `Add ${track.title} to queue`
                              : `${track.title} is already in the queue`
                          }
                          title={canAddToQueue ? "Add to queue" : "In queue"}
                          data-testid="fmdReleaseTrackQueueButton"
                        >
                          {canAddToQueue ? (
                            <ListPlusThinIcon />
                          ) : (
                            <CheckThinIcon />
                          )}
                        </IconButton>
                      )
                    ) : (
                      <span className={styles.queueButtonSpacer} aria-hidden />
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
        {onAddAllToQueue || onRemoveAllFromQueue ? (
          <div className={styles.tracklistToolbar}>
            {allPlayableTracksQueued && onRemoveAllFromQueue ? (
              <IconButton
                variant="queue"
                className={styles.addAllButton}
                iconClassName={styles.addAllButtonIcon}
                label="Remove all from queue"
                onClick={onRemoveAllFromQueue}
                aria-label="Remove all playable tracks from queue"
                title="Remove all from queue"
                data-testid="fmdReleaseTracklistRemoveAllButton"
              >
                <ListThinIcon />
              </IconButton>
            ) : onAddAllToQueue ? (
              <IconButton
                variant="queue"
                className={styles.addAllButton}
                iconClassName={styles.addAllButtonIcon}
                label="Add all to queue"
                onClick={onAddAllToQueue}
                aria-label="Add all playable tracks to queue"
                title="Add all to queue"
                data-testid="fmdReleaseTracklistAddAllButton"
              >
                <ListPlusThinIcon />
              </IconButton>
            ) : null}
          </div>
        ) : null}
      </Tooltip.Provider>
    </div>
  );
};
