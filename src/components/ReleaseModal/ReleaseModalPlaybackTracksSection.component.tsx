"use client";

import classNames from "classnames";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { ReleasePlaybackFallback } from "src/components/ReleasePlaybackFallback/ReleasePlaybackFallback.component";
import { ReleasePlaybackPreview } from "src/components/ReleasePlaybackPreview/ReleasePlaybackPreview.component";
import { ReleaseTracklist } from "src/components/ReleaseTracklist/ReleaseTracklist.component";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import { definedProps } from "src/utils/definedProps";
import type { UserTrackStatCounts } from "src/utils/userTrack";

interface ReleaseModalPlaybackTracksSectionProps {
  releaseArtistNames: string;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  hasEmbeddableVideo: boolean;
  hasTracklistPlayback: boolean;
  releasePreviewVideos: DiscogsVideo[];
  releasePreviewTracks: DiscogsTrack[];
  isTrackPlayable: (trackPosition: string) => boolean;
  trackStatsByPosition?: Record<string, UserTrackStatCounts>;
  userYoutubeIdByPosition: Readonly<Record<string, string>>;
  onEditTrackYoutube?: (trackPosition: string) => void;
  activeTrackPosition: string | null;
  activePreviewTrackPosition: string | null;
  fallbackSearchUrl: string;
  handleTrackSelect: (trackPosition: string) => void;
  handleTrackQueue: (trackPosition: string) => void;
  handleTrackUnqueue: (trackPosition: string) => void;
  handleAddAllToQueue: () => void;
  handleRemoveAllFromQueue: () => void;
  allPlayableTracksQueued: boolean;
  handlePreviewTrackSelect: (trackPosition: string) => void;
  handlePreviewTrackQueue: (trackPosition: string) => void;
  handlePreviewTrackUnqueue: (trackPosition: string) => void;
  isTrackQueued: (trackPosition: string) => boolean;
  isTrackUnqueueable: (trackPosition: string) => boolean;
  isPreviewTrackQueued: (trackPosition: string) => boolean;
  isPreviewTrackUnqueueable: (trackPosition: string) => boolean;
  handleActiveTrackToggle: () => void;
  isPlayingThisReleaseInBar: boolean;
  isPlaybackPaused: boolean;
  isReleasePreviewPlaying: boolean;
}

export const ReleaseModalPlaybackTracksSection = ({
  tracks,
  videos,
  hasEmbeddableVideo,
  hasTracklistPlayback,
  releasePreviewVideos,
  releasePreviewTracks,
  isTrackPlayable,
  trackStatsByPosition,
  userYoutubeIdByPosition,
  onEditTrackYoutube,
  activeTrackPosition,
  activePreviewTrackPosition,
  fallbackSearchUrl,
  handleTrackSelect,
  handleTrackQueue,
  handleTrackUnqueue,
  handleAddAllToQueue,
  handleRemoveAllFromQueue,
  allPlayableTracksQueued,
  handlePreviewTrackSelect,
  handlePreviewTrackQueue,
  handlePreviewTrackUnqueue,
  isTrackQueued,
  isTrackUnqueueable,
  isPreviewTrackQueued,
  isPreviewTrackUnqueueable,
  handleActiveTrackToggle,
  isPlayingThisReleaseInBar,
  isPlaybackPaused,
  isReleasePreviewPlaying,
  releaseArtistNames,
}: ReleaseModalPlaybackTracksSectionProps) => {
  const reserveQueueColumn =
    hasTracklistPlayback ||
    releasePreviewVideos.length > 0 ||
    onEditTrackYoutube !== undefined;

  const showAlbumBarPlayback =
    hasTracklistPlayback &&
    isPlayingThisReleaseInBar &&
    !isReleasePreviewPlaying;
  const showPreviewBarPlayback =
    isPlayingThisReleaseInBar && isReleasePreviewPlaying;

  const hasUserYoutubeOverride = (trackPosition: string) =>
    Boolean(userYoutubeIdByPosition[trackPosition]);
  const hasUserYoutubeOverrideOnRelease =
    Object.keys(userYoutubeIdByPosition).length > 0;

  return (
    <section
      className={classNames(styles.modalCard, styles.playbackSection)}
      aria-label="Tracks"
    >
      {!(hasEmbeddableVideo || hasUserYoutubeOverrideOnRelease) ? (
        <ReleasePlaybackFallback
          fallbackSearchUrl={fallbackSearchUrl}
          videos={videos}
        />
      ) : null}
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        activeTrackPosition={activeTrackPosition}
        reserveQueueColumn={reserveQueueColumn}
        {...definedProps({ trackStatsByPosition })}
        showPlayingIndicatorOnActiveTrack={showAlbumBarPlayback}
        isPlaybackPaused={showAlbumBarPlayback ? isPlaybackPaused : false}
        {...definedProps({
          isTrackPlayable: hasTracklistPlayback ? isTrackPlayable : undefined,
          onTrackSelect: hasTracklistPlayback ? handleTrackSelect : undefined,
          isTrackQueued: hasTracklistPlayback ? isTrackQueued : undefined,
          isTrackUnqueueable: hasTracklistPlayback
            ? isTrackUnqueueable
            : undefined,
          onTrackQueue: hasTracklistPlayback ? handleTrackQueue : undefined,
          onTrackUnqueue: hasTracklistPlayback ? handleTrackUnqueue : undefined,
          onAddAllToQueue: hasTracklistPlayback
            ? handleAddAllToQueue
            : undefined,
          onRemoveAllFromQueue: hasTracklistPlayback
            ? handleRemoveAllFromQueue
            : undefined,
          allPlayableTracksQueued: hasTracklistPlayback
            ? allPlayableTracksQueued
            : undefined,
          onActiveTrackToggle: showAlbumBarPlayback
            ? handleActiveTrackToggle
            : undefined,
          onEditTrackYoutube,
          hasUserYoutubeOverride: onEditTrackYoutube
            ? hasUserYoutubeOverride
            : undefined,
        })}
      />
      {releasePreviewVideos.length > 0 ? (
        <ReleasePlaybackPreview
          tracks={releasePreviewTracks}
          releaseArtistNames={releaseArtistNames}
          activeTrackPosition={activePreviewTrackPosition}
          showPlayingIndicatorOnActiveTrack={showPreviewBarPlayback}
          isPlaybackPaused={showPreviewBarPlayback ? isPlaybackPaused : false}
          isTrackQueued={isPreviewTrackQueued}
          isTrackUnqueueable={isPreviewTrackUnqueueable}
          onTrackSelect={handlePreviewTrackSelect}
          onTrackQueue={handlePreviewTrackQueue}
          onTrackUnqueue={handlePreviewTrackUnqueue}
          {...definedProps({
            onActiveTrackToggle: showPreviewBarPlayback
              ? handleActiveTrackToggle
              : undefined,
          })}
        />
      ) : null}
    </section>
  );
};
