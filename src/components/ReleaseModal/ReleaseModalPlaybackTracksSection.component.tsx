"use client";

import classNames from "classnames";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ReleasePlaybackFallback } from "src/components/ReleasePlaybackFallback/ReleasePlaybackFallback.component";
import { ReleasePlaybackPreview } from "src/components/ReleasePlaybackPreview/ReleasePlaybackPreview.component";
import { ReleaseTracklist } from "src/components/ReleaseTracklist/ReleaseTracklist.component";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { formatArtistNames } from "src/utils/releaseDisplay";

interface ReleaseModalPlaybackTracksSectionProps {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  hasEmbeddableVideo: boolean;
  hasPlayableTracks: boolean;
  releasePreviewVideos: DiscogsVideo[];
  releasePreviewTracks: DiscogsTrack[];
  isTrackPlayable: (trackPosition: string) => boolean;
  activeTrackPosition: string | null;
  activePreviewTrackPosition: string | null;
  fallbackSearchUrl: string;
  handleTrackSelect: (trackPosition: string) => void;
  handleTrackQueue: (trackPosition: string) => void;
  handleAddAllToQueue: () => void;
  allPlayableTracksQueued: boolean;
  handlePreviewTrackSelect: (trackPosition: string) => void;
  handlePreviewTrackQueue: (trackPosition: string) => void;
  isTrackQueued: (trackPosition: string) => boolean;
  isPreviewTrackQueued: (trackPosition: string) => boolean;
  handleActiveTrackToggle: () => void;
  isPlayingThisReleaseInBar: boolean;
  isPlaybackPaused: boolean;
  isReleasePreviewPlaying: boolean;
}

export const ReleaseModalPlaybackTracksSection = ({
  release,
  tracks,
  videos,
  hasEmbeddableVideo,
  hasPlayableTracks,
  releasePreviewVideos,
  releasePreviewTracks,
  isTrackPlayable,
  activeTrackPosition,
  activePreviewTrackPosition,
  fallbackSearchUrl,
  handleTrackSelect,
  handleTrackQueue,
  handleAddAllToQueue,
  allPlayableTracksQueued,
  handlePreviewTrackSelect,
  handlePreviewTrackQueue,
  isTrackQueued,
  isPreviewTrackQueued,
  handleActiveTrackToggle,
  isPlayingThisReleaseInBar,
  isPlaybackPaused,
  isReleasePreviewPlaying,
}: ReleaseModalPlaybackTracksSectionProps) => {
  const reserveQueueColumn =
    hasPlayableTracks || releasePreviewVideos.length > 0;

  return (
    <section
      className={classNames(styles.modalCard, styles.playbackSection)}
      aria-label="Tracks"
    >
      {!hasEmbeddableVideo ? (
        <ReleasePlaybackFallback
          fallbackSearchUrl={fallbackSearchUrl}
          videos={videos}
        />
      ) : null}
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={formatArtistNames(release)}
        activeTrackPosition={activeTrackPosition}
        reserveQueueColumn={reserveQueueColumn}
        showPlayingIndicatorOnActiveTrack={
          hasPlayableTracks &&
          isPlayingThisReleaseInBar &&
          !isReleasePreviewPlaying
        }
        isPlaybackPaused={
          hasPlayableTracks &&
          isPlayingThisReleaseInBar &&
          !isReleasePreviewPlaying
            ? isPlaybackPaused
            : false
        }
        {...definedProps({
          isTrackPlayable: hasPlayableTracks ? isTrackPlayable : undefined,
          onTrackSelect: hasPlayableTracks ? handleTrackSelect : undefined,
          isTrackQueued: hasPlayableTracks ? isTrackQueued : undefined,
          onTrackQueue: hasPlayableTracks ? handleTrackQueue : undefined,
          onAddAllToQueue: hasPlayableTracks ? handleAddAllToQueue : undefined,
          addAllToQueueDisabled: hasPlayableTracks
            ? allPlayableTracksQueued
            : undefined,
          onActiveTrackToggle:
            hasPlayableTracks &&
            isPlayingThisReleaseInBar &&
            !isReleasePreviewPlaying
              ? handleActiveTrackToggle
              : undefined,
        })}
      />
      {releasePreviewVideos.length > 0 ? (
        <ReleasePlaybackPreview
          tracks={releasePreviewTracks}
          releaseArtistNames={formatArtistNames(release)}
          activeTrackPosition={activePreviewTrackPosition}
          showPlayingIndicatorOnActiveTrack={
            isPlayingThisReleaseInBar && isReleasePreviewPlaying
          }
          isPlaybackPaused={
            isPlayingThisReleaseInBar && isReleasePreviewPlaying
              ? isPlaybackPaused
              : false
          }
          isTrackQueued={isPreviewTrackQueued}
          onTrackSelect={handlePreviewTrackSelect}
          onTrackQueue={handlePreviewTrackQueue}
          {...definedProps({
            onActiveTrackToggle:
              isPlayingThisReleaseInBar && isReleasePreviewPlaying
                ? handleActiveTrackToggle
                : undefined,
          })}
        />
      ) : null}
    </section>
  );
};
