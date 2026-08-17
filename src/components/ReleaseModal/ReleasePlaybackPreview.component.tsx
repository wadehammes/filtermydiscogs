"use client";

import type { DiscogsTrack } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseModal.module.css";
import { ReleaseTracklist } from "./ReleaseTracklist.component";

interface ReleasePlaybackPreviewProps {
  tracks: DiscogsTrack[];
  releaseArtistNames: string;
  activeTrackPosition: string | null;
  showPlayingIndicatorOnActiveTrack?: boolean;
  isPlaybackPaused?: boolean;
  isTrackQueued?: (position: string) => boolean;
  onTrackSelect: (position: string) => void;
  onTrackQueue: (position: string) => void;
  onActiveTrackToggle?: () => void;
}

export const ReleasePlaybackPreview = ({
  tracks,
  releaseArtistNames,
  activeTrackPosition,
  showPlayingIndicatorOnActiveTrack = false,
  isPlaybackPaused = false,
  isTrackQueued,
  onTrackSelect,
  onTrackQueue,
  onActiveTrackToggle,
}: ReleasePlaybackPreviewProps) => {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.playbackPreview}
      data-testid="fmdReleasePlaybackPreview"
    >
      <p className={styles.previewMessage}>
        {tracks.length === 1
          ? "Extra release video (not matched to a track)."
          : `${tracks.length} extra release videos (not matched to tracks).`}
      </p>
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={activeTrackPosition}
        hideTrackPosition
        showPlayingIndicatorOnActiveTrack={showPlayingIndicatorOnActiveTrack}
        isPlaybackPaused={isPlaybackPaused}
        isTrackPlayable={() => true}
        {...definedProps({
          isTrackQueued,
          onTrackSelect,
          onTrackQueue,
          onActiveTrackToggle,
        })}
      />
    </div>
  );
};
