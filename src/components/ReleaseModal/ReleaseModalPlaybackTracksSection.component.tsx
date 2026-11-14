"use client";

import classNames from "classnames";
import styles from "src/components/ReleaseModal/ReleaseModal.module.css";
import { getReleaseModalPlaybackFallbackProps } from "src/components/ReleaseModal/ReleaseModalPlaybackFallbackProps.utils";
import { ReleasePlaybackFallback } from "src/components/ReleasePlaybackFallback/ReleasePlaybackFallback.component";
import { ReleasePlaybackPreview } from "src/components/ReleasePlaybackPreview/ReleasePlaybackPreview.component";
import { ReleaseTracklist } from "src/components/ReleaseTracklist/ReleaseTracklist.component";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import { definedProps } from "src/utils/definedProps";
import type { UserTrackStatCounts } from "src/utils/userTrack";

interface ReleaseModalPlaybackTracksSectionProps {
  discogsReleaseId: number | null | undefined;
  releaseTitle: string;
  releaseArtistNames: string;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  hasTracklistPlayback: boolean;
  releasePreviewVideos: DiscogsVideo[];
  releasePreviewTracks: DiscogsTrack[];
  isTrackPlayable: (trackPosition: string) => boolean;
  trackStatsByPosition?: Record<string, UserTrackStatCounts>;
  userYoutubeIdByPosition: Readonly<Record<string, string>>;
  onEditTrackYoutube?: (trackPosition: string) => void;
  getPlaylistTrackMetadata?: (
    trackPosition: string,
  ) => UserTrackMetadataBody | undefined;
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
  discogsReleaseId,
  releaseTitle,
  tracks,
  videos,
  hasTracklistPlayback,
  releasePreviewVideos,
  releasePreviewTracks,
  isTrackPlayable,
  trackStatsByPosition,
  userYoutubeIdByPosition,
  onEditTrackYoutube,
  getPlaylistTrackMetadata,
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
  const reserveQueueColumn = true;
  const showMainTracklistQueue = hasTracklistPlayback;

  const showAlbumBarPlayback =
    hasTracklistPlayback &&
    isPlayingThisReleaseInBar &&
    !isReleasePreviewPlaying;
  const showPreviewBarPlayback =
    isPlayingThisReleaseInBar && isReleasePreviewPlaying;

  const hasUserYoutubeOverride = (trackPosition: string) =>
    Boolean(userYoutubeIdByPosition[trackPosition]);
  const { fallbackVideos, tracksLackMatchedVideos } =
    getReleaseModalPlaybackFallbackProps(videos, releasePreviewVideos);

  return (
    <section
      className={classNames(styles.modalCard, styles.playbackSection)}
      aria-label="Tracks"
    >
      {!hasTracklistPlayback ? (
        <ReleasePlaybackFallback
          discogsReleaseId={discogsReleaseId}
          fallbackSearchUrl={fallbackSearchUrl}
          tracksLackMatchedVideos={tracksLackMatchedVideos}
          videos={fallbackVideos}
        />
      ) : null}
      <ReleaseTracklist
        tracks={tracks}
        releaseArtistNames={releaseArtistNames}
        releaseTitle={releaseTitle}
        useAddAllMenuOverlayStack
        activeTrackPosition={activeTrackPosition}
        reserveQueueColumn={reserveQueueColumn}
        alwaysShowTrackRowMenu
        {...definedProps({ trackStatsByPosition })}
        showPlayingIndicatorOnActiveTrack={showAlbumBarPlayback}
        isPlaybackPaused={showAlbumBarPlayback ? isPlaybackPaused : false}
        {...definedProps({
          isTrackPlayable: showMainTracklistQueue ? isTrackPlayable : undefined,
          onTrackSelect: showMainTracklistQueue ? handleTrackSelect : undefined,
          isTrackQueued: showMainTracklistQueue ? isTrackQueued : undefined,
          isTrackUnqueueable: showMainTracklistQueue
            ? isTrackUnqueueable
            : undefined,
          onTrackQueue: showMainTracklistQueue ? handleTrackQueue : undefined,
          onTrackUnqueue: showMainTracklistQueue
            ? handleTrackUnqueue
            : undefined,
          onAddAllToQueue: showMainTracklistQueue
            ? handleAddAllToQueue
            : undefined,
          onRemoveAllFromQueue: showMainTracklistQueue
            ? handleRemoveAllFromQueue
            : undefined,
          allPlayableTracksQueued: showMainTracklistQueue
            ? allPlayableTracksQueued
            : undefined,
          onActiveTrackToggle: showAlbumBarPlayback
            ? handleActiveTrackToggle
            : undefined,
          onEditTrackYoutube,
          getPlaylistTrackMetadata,
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
