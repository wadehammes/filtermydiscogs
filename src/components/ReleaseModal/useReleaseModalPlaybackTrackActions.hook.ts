import { useCallback } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import { showPlaybackQueueSuccessToast } from "src/utils/playbackQueueToast";
import {
  findPreviewVideoForTrackPosition,
  parseYoutubeVideoId,
  type ReleasePlaybackMatchIndex,
  resolvePlayableTrackAtPosition,
} from "src/utils/releasePlayback";

interface UseReleaseModalPlaybackTrackActionsParams {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  playbackMatchIndex: ReleasePlaybackMatchIndex;
  releasePreviewVideos: DiscogsVideo[];
  setSelectedTrackPosition: (position: string | null) => void;
}

export const useReleaseModalPlaybackTrackActions = ({
  release,
  tracks,
  playbackMatchIndex,
  releasePreviewVideos,
  setSelectedTrackPosition,
}: UseReleaseModalPlaybackTrackActionsParams) => {
  const playback = useReleasePlayback();

  const handleTrackSelect = useCallback(
    (trackPosition: string) => {
      const resolved = resolvePlayableTrackAtPosition({
        trackPosition,
        tracks,
        playbackMatchIndex,
      });

      if (!resolved) {
        return;
      }

      setSelectedTrackPosition(trackPosition);

      const youtubeVideoId = parseYoutubeVideoId(resolved.matchedVideo.uri);

      playback.startPlayback({
        release,
        trackPosition,
        trackTitle: resolved.track.title,
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
      });
    },
    [
      playback.startPlayback,
      playbackMatchIndex,
      release,
      setSelectedTrackPosition,
      tracks,
    ],
  );

  const handleTrackQueue = useCallback(
    (trackPosition: string) => {
      const resolved = resolvePlayableTrackAtPosition({
        trackPosition,
        tracks,
        playbackMatchIndex,
      });

      if (!resolved) {
        return;
      }

      playback.addToQueue({
        release,
        trackPosition,
        trackTitle: resolved.track.title,
      });
      showPlaybackQueueSuccessToast(1);
    },
    [playback.addToQueue, playbackMatchIndex, release, tracks],
  );

  const handleReleasePreview = useCallback(
    (video: DiscogsVideo) => {
      setSelectedTrackPosition(null);
      playback.startReleasePreview({ release, video });
    },
    [playback.startReleasePreview, release, setSelectedTrackPosition],
  );

  const handlePreviewTrackSelect = useCallback(
    (trackPosition: string) => {
      const video = findPreviewVideoForTrackPosition({
        trackPosition,
        releasePreviewVideos,
      });

      if (!video) {
        return;
      }

      handleReleasePreview(video);
    },
    [handleReleasePreview, releasePreviewVideos],
  );

  const handlePreviewTrackQueue = useCallback(
    (trackPosition: string) => {
      const video = findPreviewVideoForTrackPosition({
        trackPosition,
        releasePreviewVideos,
      });

      if (!video) {
        return;
      }

      playback.addPreviewToQueue({ release, video });
      showPlaybackQueueSuccessToast(1);
    },
    [playback.addPreviewToQueue, release, releasePreviewVideos],
  );

  return {
    handleTrackSelect,
    handleTrackQueue,
    handleReleasePreview,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
  };
};
