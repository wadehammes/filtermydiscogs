import { useCallback } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import { showPlaybackQueueSuccessToast } from "src/utils/playbackQueueToast";
import {
  findPreviewVideoForTrackPosition,
  type ReleasePlaybackMatchIndex,
} from "src/utils/releasePlayback";
import { resolveTrackPlaybackYoutubeVideoId } from "src/utils/trackPlaybackYoutube";

interface UseReleaseModalPlaybackTrackActionsParams {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  playbackMatchIndex: ReleasePlaybackMatchIndex;
  releasePreviewVideos: DiscogsVideo[];
  setSelectedTrackPosition: (position: string | null) => void;
  userYoutubeIdByPosition: Readonly<Record<string, string>>;
}

export const useReleaseModalPlaybackTrackActions = ({
  release,
  tracks,
  playbackMatchIndex,
  releasePreviewVideos,
  setSelectedTrackPosition,
  userYoutubeIdByPosition,
}: UseReleaseModalPlaybackTrackActionsParams) => {
  const playback = useReleasePlayback();

  const startAlbumTrackWithYoutubeVideoId = useCallback(
    (trackPosition: string, youtubeVideoId: string) => {
      const track = tracks.find((row) => row.position === trackPosition);

      if (!track) {
        return;
      }

      setSelectedTrackPosition(trackPosition);

      playback.startPlayback({
        release,
        trackPosition,
        trackTitle: track.title,
        youtubeVideoId,
      });
    },
    [playback.startPlayback, release, setSelectedTrackPosition, tracks],
  );

  const handleTrackSelect = useCallback(
    (trackPosition: string) => {
      const youtubeVideoId = resolveTrackPlaybackYoutubeVideoId({
        trackPosition,
        tracks,
        playbackMatchIndex,
        userYoutubeIdByPosition,
      });

      if (!youtubeVideoId) {
        return;
      }

      startAlbumTrackWithYoutubeVideoId(trackPosition, youtubeVideoId);
    },
    [
      playbackMatchIndex,
      startAlbumTrackWithYoutubeVideoId,
      tracks,
      userYoutubeIdByPosition,
    ],
  );

  const handleTrackQueue = useCallback(
    (trackPosition: string) => {
      const youtubeVideoId = resolveTrackPlaybackYoutubeVideoId({
        trackPosition,
        tracks,
        playbackMatchIndex,
        userYoutubeIdByPosition,
      });

      if (!youtubeVideoId) {
        return;
      }

      const track = tracks.find((row) => row.position === trackPosition);

      if (!track) {
        return;
      }

      playback.addToQueue({
        release,
        trackPosition,
        trackTitle: track.title,
        youtubeVideoId,
      });
      showPlaybackQueueSuccessToast(1);
    },
    [
      playback.addToQueue,
      playbackMatchIndex,
      release,
      tracks,
      userYoutubeIdByPosition,
    ],
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
    startAlbumTrackWithYoutubeVideoId,
    handleTrackQueue,
    handleReleasePreview,
    handlePreviewTrackSelect,
    handlePreviewTrackQueue,
  };
};
