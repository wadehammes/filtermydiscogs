"use client";

import { useCallback } from "react";
import { ReleaseModalPlaybackTracksSection } from "src/components/ReleaseModal/ReleaseModalPlaybackTracksSection.component";
import type { ReleaseModalPlaybackState } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import { TrackYoutubeOverrideDialog } from "src/components/TrackYoutubeOverrideDialog/TrackYoutubeOverrideDialog.component";
import { useAuth } from "src/context/auth.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease } from "src/types";
import { buildUserTrackMetadataBody } from "src/utils/buildUserTrackMetadataBody";
import { definedProps } from "src/utils/definedProps";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { isSameReleaseInstance } from "src/utils/releaseNotes";

interface ReleaseModalPlaybackTracksFromStateProps {
  release: DiscogsRelease;
  playback: ReleaseModalPlaybackState;
}

export const ReleaseModalPlaybackTracksFromState = ({
  release,
  playback,
}: ReleaseModalPlaybackTracksFromStateProps) => {
  const { state: authState } = useAuth();
  const barPlayback = useReleasePlayback();
  const { isLoading, isError } = playback;
  const releaseArtistNames = formatArtistNames(release);
  const releaseTitle = release.basic_information.title;

  const getPlaylistTrackMetadata = useCallback(
    (trackPosition: string) => {
      if (!authState.userId) {
        return undefined;
      }

      const track = playback.tracks.find(
        (row) => row.position === trackPosition,
      );

      if (!track) {
        return undefined;
      }

      const youtubeId = playback.userYoutubeIdByPosition[trackPosition];

      return buildUserTrackMetadataBody({
        release,
        trackPosition,
        trackTitle: track.title,
        artist: releaseArtistNames,
        releaseTitle,
        ...definedProps({
          youtubeId: youtubeId ? youtubeId : undefined,
        }),
      });
    },
    [
      authState.userId,
      playback.tracks,
      playback.userYoutubeIdByPosition,
      release,
      releaseArtistNames,
      releaseTitle,
    ],
  );

  if (isLoading || isError) {
    return null;
  }

  const {
    tracks,
    videos,
    hasEmbeddableVideo,
    hasTracklistPlayback,
    releasePreviewVideos,
    releasePreviewTracks,
    isTrackPlayable,
    trackStatsByPosition,
    userYoutubeIdByPosition,
    youtubeOverrideTarget,
    openTrackYoutubeOverride,
    closeTrackYoutubeOverride,
    activeTrackPosition,
    activePreviewTrackPosition,
    fallbackSearchUrl,
    handleTrackSelect,
    startAlbumTrackWithYoutubeVideoId,
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
  } = playback;

  const canEditTrackYoutube = authState.userId != null;
  const canAddToPlaylist = authState.userId != null;

  return (
    <>
      <ReleaseModalPlaybackTracksSection
        releaseTitle={releaseTitle}
        tracks={tracks}
        videos={videos}
        hasEmbeddableVideo={hasEmbeddableVideo}
        hasTracklistPlayback={hasTracklistPlayback}
        releasePreviewVideos={releasePreviewVideos}
        releasePreviewTracks={releasePreviewTracks}
        isTrackPlayable={isTrackPlayable}
        {...definedProps({ trackStatsByPosition })}
        userYoutubeIdByPosition={userYoutubeIdByPosition}
        {...(canEditTrackYoutube
          ? { onEditTrackYoutube: openTrackYoutubeOverride }
          : {})}
        {...(canAddToPlaylist ? { getPlaylistTrackMetadata } : {})}
        activeTrackPosition={activeTrackPosition}
        activePreviewTrackPosition={activePreviewTrackPosition}
        fallbackSearchUrl={fallbackSearchUrl}
        handleTrackSelect={handleTrackSelect}
        handleTrackQueue={handleTrackQueue}
        handleTrackUnqueue={handleTrackUnqueue}
        handleAddAllToQueue={handleAddAllToQueue}
        handleRemoveAllFromQueue={handleRemoveAllFromQueue}
        allPlayableTracksQueued={allPlayableTracksQueued}
        handlePreviewTrackSelect={handlePreviewTrackSelect}
        handlePreviewTrackQueue={handlePreviewTrackQueue}
        handlePreviewTrackUnqueue={handlePreviewTrackUnqueue}
        isTrackQueued={isTrackQueued}
        isTrackUnqueueable={isTrackUnqueueable}
        isPreviewTrackQueued={isPreviewTrackQueued}
        isPreviewTrackUnqueueable={isPreviewTrackUnqueueable}
        handleActiveTrackToggle={handleActiveTrackToggle}
        isPlayingThisReleaseInBar={isPlayingThisReleaseInBar}
        isPlaybackPaused={isPlaybackPaused}
        isReleasePreviewPlaying={isReleasePreviewPlaying}
        releaseArtistNames={releaseArtistNames}
      />
      <TrackYoutubeOverrideDialog
        open={youtubeOverrideTarget !== null}
        target={youtubeOverrideTarget}
        onClose={closeTrackYoutubeOverride}
        onSaved={(youtubeVideoId) => {
          const target = youtubeOverrideTarget;

          if (!(target && youtubeVideoId)) {
            return;
          }

          const isActiveSkippedTrack =
            isSameReleaseInstance(release, barPlayback.release) &&
            !barPlayback.isReleasePreview &&
            barPlayback.activeTrackPosition === target.trackPosition;

          if (!isActiveSkippedTrack) {
            return;
          }

          startAlbumTrackWithYoutubeVideoId(
            target.trackPosition,
            youtubeVideoId,
          );
        }}
      />
    </>
  );
};
