import { useCallback, useMemo } from "react";
import { useReleaseDetailPlaybackIndex } from "src/components/ReleaseModal/useReleaseDetailPlaybackIndex.hook";
import { useReleaseModalPlaybackQueue } from "src/components/ReleaseModal/useReleaseModalPlaybackQueue.hook";
import { useReleaseModalPlaybackSelection } from "src/components/ReleaseModal/useReleaseModalPlaybackSelection.hook";
import { useReleaseModalPlaybackTrackActions } from "src/components/ReleaseModal/useReleaseModalPlaybackTrackActions.hook";
import { useReleaseModalReleaseDetailQuery } from "src/components/ReleaseModal/useReleaseModalReleaseDetailQuery.hook";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease } from "src/types";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { parseReleaseId } from "src/utils/releaseNotes";
import {
  buildYoutubeSearchUrl,
  previewVideosToTracks,
} from "src/utils/releasePlayback";

interface UseReleaseModalPlaybackParams {
  release: DiscogsRelease;
  isOpen: boolean;
}

export const useReleaseModalPlayback = ({
  release,
  isOpen,
}: UseReleaseModalPlaybackParams) => {
  const playback = useReleasePlayback();
  const releaseId = parseReleaseId(release);
  const releaseIdString = releaseId !== null ? String(releaseId) : "";
  const queryEnabled = isOpen && releaseId !== null;

  const { releaseDetail, isLoading, isError, refetch } =
    useReleaseModalReleaseDetailQuery({
      releaseIdString,
      enabled: queryEnabled,
    });

  const { tracks, videos, playbackMatchIndex } = useReleaseDetailPlaybackIndex({
    tracklist: releaseDetail?.tracklist,
    videos: releaseDetail?.videos,
  });

  const hasEmbeddableVideo = playbackMatchIndex.embeddableVideos.length > 0;

  const hasPlayableTracks = playbackMatchIndex.hasPlayableTracks;

  const releasePreviewVideos = playbackMatchIndex.previewVideos;

  const {
    isPlayingThisReleaseInBar,
    activePreviewTrackPosition,
    activeTrackPosition,
    setSelectedTrackPosition,
  } = useReleaseModalPlaybackSelection({
    release,
    isOpen,
    playback,
    releasePreviewVideos,
  });

  const releasePreviewTracks = useMemo(
    () => previewVideosToTracks(releasePreviewVideos),
    [releasePreviewVideos],
  );

  const isTrackPlayable = useCallback(
    (trackPosition: string) =>
      playbackMatchIndex.trackVideoByPosition.has(trackPosition),
    [playbackMatchIndex],
  );

  const fallbackSearchUrl = buildYoutubeSearchUrl({
    artist: formatArtistNames(release),
    trackTitle: release.basic_information.title,
  });

  const {
    handleTrackSelect,
    handleTrackQueue,
    handleReleasePreview,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
  } = useReleaseModalPlaybackTrackActions({
    release,
    tracks,
    playbackMatchIndex,
    releasePreviewVideos,
    setSelectedTrackPosition,
  });

  const {
    isTrackQueued,
    isPreviewTrackQueued,
    allPlayableTracksQueued,
    handleAddAllToQueue,
  } = useReleaseModalPlaybackQueue({
    release,
    tracks,
    playbackMatchIndex,
  });

  const handleActiveTrackToggle = useCallback(() => {
    playback.togglePlayback();
  }, [playback.togglePlayback]);

  return {
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
    isLoading,
    isError,
    refetch,
    handleTrackSelect,
    handleTrackQueue,
    handleAddAllToQueue,
    allPlayableTracksQueued,
    handleReleasePreview,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
    isTrackQueued,
    isPreviewTrackQueued,
    handleActiveTrackToggle,
    isPlayingThisReleaseInBar,
    isPlaybackPaused: playback.isPaused,
    isReleasePreviewPlaying:
      isPlayingThisReleaseInBar && playback.isReleasePreview,
  };
};

export type ReleaseModalPlaybackState = ReturnType<
  typeof useReleaseModalPlayback
>;
