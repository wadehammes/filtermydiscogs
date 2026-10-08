"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { PlayingIndicator } from "src/components/PlayingIndicator/PlayingIndicator.component";
import { ReleaseTrackRowMenu } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenu.component";
import { RELEASE_TRACKLIST_LABEL } from "src/constants/accessibilityLabels.constants";
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
  onEditTrackYoutube?: (position: string) => void;
  hasUserYoutubeOverride?: (position: string) => boolean;
  alwaysShowTrackRowMenu?: boolean;
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
  onEditTrackYoutube,
  hasUserYoutubeOverride,
  alwaysShowTrackRowMenu = false,
}: ReleaseTracklistProps) => {
  const hasSelectableTracks = onTrackSelect !== undefined;
  const hasQueueAdd = onTrackQueue !== undefined;
  const hasQueueRemove = onTrackUnqueue !== undefined;
  const hasYoutubeEdit = onEditTrackYoutube !== undefined;
  const hasAnyRowMenuAction = hasYoutubeEdit || hasQueueAdd || hasQueueRemove;
  const showTrackActionsColumn =
    alwaysShowTrackRowMenu ||
    hasYoutubeEdit ||
    hasQueueAdd ||
    reserveQueueColumn;
  const showTrackRowMenu =
    alwaysShowTrackRowMenu || (showTrackActionsColumn && hasAnyRowMenuAction);
  const releaseHasQueueActions = hasQueueAdd;

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
          aria-label={RELEASE_TRACKLIST_LABEL}
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
              hasQueueRemove &&
              (isTrackUnqueueable?.(track.position) ?? false);
            const canAddToQueue =
              hasQueueAdd && (!isQueued || (isActive && !canUnqueue));
            const showQueueControl =
              canPlayTrack && (hasQueueAdd || canUnqueue);
            const hasOverride =
              hasUserYoutubeOverride?.(track.position) ?? false;
            const hasDefaultYoutubeEmbed =
              (isTrackPlayable?.(track.position) ?? false) && !hasOverride;
            const showQueuedAtRest =
              isQueued && showTrackRowMenu && releaseHasQueueActions;
            const showQueueActionsSlot =
              showTrackActionsColumn &&
              (showTrackRowMenu || showQueuedAtRest || reserveQueueColumn);
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
                  [styles.trackItemMenuHover]: showTrackRowMenu,
                  [styles.trackItemQueuedAtRest]: showQueuedAtRest,
                })}
                {...(showQueuedAtRest
                  ? { "data-track-queued-at-rest": "" }
                  : {})}
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
                    aria-label={`Play ${track.title}`}
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
                  {showQueueActionsSlot ? (
                    <div className={styles.queueActionsSlot}>
                      {showQueuedAtRest ? (
                        <span
                          className={classNames(
                            styles.queueSlotRest,
                            styles.queueSlotRestQueued,
                          )}
                          role="status"
                          aria-label="In queue"
                          title="In queue"
                          data-testid="fmdReleaseTrackQueueStatus"
                        >
                          {canUnqueue ? (
                            <span data-testid="fmdReleaseTrackQueueRemoveIcon">
                              <MinusIcon />
                            </span>
                          ) : (
                            <CheckThinIcon data-testid="fmdReleaseTrackQueueCheckIcon" />
                          )}
                        </span>
                      ) : null}
                      {showTrackRowMenu ? (
                        <ReleaseTrackRowMenu
                          className={styles.trackRowMenu}
                          trackTitle={track.title}
                          triggerClassName={styles.queueButton}
                          canAddToQueue={canAddToQueue}
                          canUnqueue={canUnqueue}
                          isQueued={isQueued}
                          hasUserYoutubeOverride={hasOverride}
                          hasDefaultYoutubeEmbed={hasDefaultYoutubeEmbed}
                          releaseHasQueueActions={releaseHasQueueActions}
                          {...definedProps({
                            onAddToQueue:
                              showQueueControl && onTrackQueue
                                ? () => {
                                    onTrackQueue(track.position);
                                  }
                                : undefined,
                            onRemoveFromQueue:
                              showQueueControl && onTrackUnqueue
                                ? () => {
                                    onTrackUnqueue(track.position);
                                  }
                                : undefined,
                            onEditYoutube: onEditTrackYoutube
                              ? () => {
                                  onEditTrackYoutube(track.position);
                                }
                              : undefined,
                          })}
                        />
                      ) : null}
                    </div>
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
