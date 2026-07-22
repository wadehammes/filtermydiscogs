import classNames from "classnames";
import type { DiscogsTrack } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { PlayingIndicator } from "./PlayingIndicator.component";
import styles from "./ReleaseTracklist.module.css";

interface ReleaseTracklistProps {
  tracks: DiscogsTrack[];
  activeTrackPosition: string | null;
  showPlayingIndicatorOnActiveTrack?: boolean;
  isPlaybackPaused?: boolean;
  onTrackSelect: (position: string) => void;
  onActiveTrackToggle?: () => void;
}

export const ReleaseTracklist = ({
  tracks,
  activeTrackPosition,
  showPlayingIndicatorOnActiveTrack = false,
  isPlaybackPaused = false,
  onTrackSelect,
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

        return (
          <li key={`${track.position}-${track.title}`}>
            <button
              type="button"
              className={classNames(styles.trackRow, {
                [styles.trackRowActive]: isActive,
              })}
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
                <span className={styles.trackTitleText}>{track.title}</span>
              </span>
              {track.duration ? (
                <span className={styles.trackDuration}>{track.duration}</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
};
