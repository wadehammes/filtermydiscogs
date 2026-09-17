"use client";

import { ReleaseModalPlaybackTracksSection } from "src/components/ReleaseModal/ReleaseModalPlaybackTracksSection.component";
import type { ReleaseModalPlaybackState } from "src/components/ReleaseModal/useReleaseModalPlayback.hook";
import type { DiscogsRelease } from "src/types";

interface ReleaseModalPlaybackTracksFromStateProps {
  release: DiscogsRelease;
  playback: ReleaseModalPlaybackState;
}

export const ReleaseModalPlaybackTracksFromState = ({
  release,
  playback,
}: ReleaseModalPlaybackTracksFromStateProps) => {
  const { isLoading, isError } = playback;

  if (isLoading || isError) {
    return null;
  }

  const {
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
  } = playback;

  return (
    <ReleaseModalPlaybackTracksSection
      release={release}
      tracks={tracks}
      videos={videos}
      hasEmbeddableVideo={hasEmbeddableVideo}
      hasPlayableTracks={hasPlayableTracks}
      releasePreviewVideos={releasePreviewVideos}
      releasePreviewTracks={releasePreviewTracks}
      isTrackPlayable={isTrackPlayable}
      activeTrackPosition={activeTrackPosition}
      activePreviewTrackPosition={activePreviewTrackPosition}
      fallbackSearchUrl={fallbackSearchUrl}
      handleTrackSelect={handleTrackSelect}
      handleTrackQueue={handleTrackQueue}
      handleAddAllToQueue={handleAddAllToQueue}
      allPlayableTracksQueued={allPlayableTracksQueued}
      handlePreviewTrackSelect={handlePreviewTrackSelect}
      handlePreviewTrackQueue={handlePreviewTrackQueue}
      isTrackQueued={isTrackQueued}
      isPreviewTrackQueued={isPreviewTrackQueued}
      handleActiveTrackToggle={handleActiveTrackToggle}
      isPlayingThisReleaseInBar={isPlayingThisReleaseInBar}
      isPlaybackPaused={isPlaybackPaused}
      isReleasePreviewPlaying={isReleasePreviewPlaying}
    />
  );
};
