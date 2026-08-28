import { useCallback, useEffect, useMemo, useState } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease, DiscogsVideo } from "src/types";
import { isSameQueueItem } from "src/utils/playbackQueue";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  buildReleasePlaybackMatchIndex,
  buildYoutubeSearchUrl,
  flattenTracklist,
  getPreviewTrackPosition,
  getPreviewVideoUriFromPosition,
  parseYoutubeVideoId,
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
  const [selectedTrackPosition, setSelectedTrackPosition] = useState<
    string | null
  >(null);

  const isPlayingThisReleaseInBar =
    playback.isPlaying && isSameReleaseInstance(playback.release, release);

  const {
    data: releaseDetail,
    isLoading: isModalQueryLoading,
    isError,
    refetch,
  } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: isOpen && releaseId !== null && !isPlayingThisReleaseInBar,
  });

  const tracks = useMemo(() => {
    if (isPlayingThisReleaseInBar) {
      return playback.tracks;
    }

    return flattenTracklist(releaseDetail?.tracklist ?? []);
  }, [isPlayingThisReleaseInBar, playback.tracks, releaseDetail?.tracklist]);

  const videos = isPlayingThisReleaseInBar
    ? playback.videos
    : (releaseDetail?.videos ?? []);

  const playbackMatchIndex = useMemo(
    () => buildReleasePlaybackMatchIndex(tracks, videos),
    [tracks, videos],
  );

  const hasEmbeddableVideo = playbackMatchIndex.embeddableVideos.length > 0;

  const hasPlayableTracks = playbackMatchIndex.hasPlayableTracks;

  const releasePreviewVideos = playbackMatchIndex.previewVideos;

  const releasePreviewTracks = useMemo(
    () => previewVideosToTracks(releasePreviewVideos),
    [releasePreviewVideos],
  );

  const isTrackPlayable = useCallback(
    (trackPosition: string) =>
      playbackMatchIndex.trackVideoByPosition.has(trackPosition),
    [playbackMatchIndex],
  );

  const activePreviewTrackPosition = useMemo(() => {
    if (
      !(
        isPlayingThisReleaseInBar &&
        playback.isReleasePreview &&
        playback.activeVideoId
      )
    ) {
      return null;
    }

    const video = releasePreviewVideos.find(
      (entry) => parseYoutubeVideoId(entry.uri) === playback.activeVideoId,
    );

    return video ? getPreviewTrackPosition(video) : null;
  }, [
    isPlayingThisReleaseInBar,
    playback.activeVideoId,
    playback.isReleasePreview,
    releasePreviewVideos,
  ]);

  const activeTrackPosition = isPlayingThisReleaseInBar
    ? playback.isReleasePreview
      ? null
      : playback.activeTrackPosition
    : selectedTrackPosition;

  const isLoading = isPlayingThisReleaseInBar
    ? playback.isLoading
    : isModalQueryLoading;

  const fallbackSearchUrl = buildYoutubeSearchUrl({
    artist: formatArtistNames(release),
    trackTitle: release.basic_information.title,
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedTrackPosition(null);
    }
  }, [isOpen]);

  const handleTrackSelect = useCallback(
    (trackPosition: string) => {
      if (!playbackMatchIndex.trackVideoByPosition.has(trackPosition)) {
        return;
      }

      const track = tracks.find((entry) => entry.position === trackPosition);

      if (!track) {
        return;
      }

      setSelectedTrackPosition(trackPosition);

      const matchedVideo =
        playbackMatchIndex.trackVideoByPosition.get(trackPosition);
      const youtubeVideoId = matchedVideo
        ? parseYoutubeVideoId(matchedVideo.uri)
        : null;

      playback.startPlayback({
        release,
        trackPosition,
        trackTitle: track.title,
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
      });
    },
    [playback.startPlayback, playbackMatchIndex, release, tracks],
  );

  const handleTrackQueue = useCallback(
    (trackPosition: string) => {
      if (!playbackMatchIndex.trackVideoByPosition.has(trackPosition)) {
        return;
      }

      const track = tracks.find((entry) => entry.position === trackPosition);

      if (!track) {
        return;
      }

      playback.addToQueue({
        release,
        trackPosition,
        trackTitle: track.title,
      });
    },
    [playback.addToQueue, playbackMatchIndex, release, tracks],
  );

  const handleReleasePreview = useCallback(
    (video: DiscogsVideo) => {
      setSelectedTrackPosition(null);
      playback.startReleasePreview({ release, video });
    },
    [playback.startReleasePreview, release],
  );

  const handlePreviewTrackSelect = useCallback(
    (trackPosition: string) => {
      const videoUri = getPreviewVideoUriFromPosition(trackPosition);

      if (!videoUri) {
        return;
      }

      const video = releasePreviewVideos.find(
        (entry) => entry.uri === videoUri,
      );

      if (!video) {
        return;
      }

      handleReleasePreview(video);
    },
    [handleReleasePreview, releasePreviewVideos],
  );

  const handlePreviewTrackQueue = useCallback(
    (trackPosition: string) => {
      const videoUri = getPreviewVideoUriFromPosition(trackPosition);

      if (!videoUri) {
        return;
      }

      const video = releasePreviewVideos.find(
        (entry) => entry.uri === videoUri,
      );

      if (!video) {
        return;
      }

      playback.addPreviewToQueue({ release, video });
    },
    [playback.addPreviewToQueue, release, releasePreviewVideos],
  );

  const isQueuePositionActive = useCallback(
    (trackPosition: string, mode: "track" | "preview") => {
      if (!isSameReleaseInstance(release, playback.release)) {
        return false;
      }

      if (mode === "preview") {
        return (
          playback.isReleasePreview &&
          playback.activeTrackPosition === trackPosition
        );
      }

      return (
        !playback.isReleasePreview &&
        playback.isMiniPlayerVisible &&
        playback.activeTrackPosition === trackPosition
      );
    },
    [
      playback.activeTrackPosition,
      playback.isMiniPlayerVisible,
      playback.isReleasePreview,
      playback.release,
      release,
    ],
  );

  const isQueuedForRelease = useCallback(
    (trackPosition: string) =>
      playback.queue.some((item) =>
        isSameQueueItem(item, {
          instanceId: String(release.instance_id),
          trackPosition,
        }),
      ),
    [playback.queue, release.instance_id],
  );

  const isPreviewTrackQueued = useCallback(
    (trackPosition: string) =>
      isQueuePositionActive(trackPosition, "preview") ||
      isQueuedForRelease(trackPosition),
    [isQueuePositionActive, isQueuedForRelease],
  );

  const isTrackQueued = useCallback(
    (trackPosition: string) =>
      isQueuePositionActive(trackPosition, "track") ||
      isQueuedForRelease(trackPosition),
    [isQueuePositionActive, isQueuedForRelease],
  );

  const playableTracks = useMemo(
    () =>
      tracks.filter((track) =>
        playbackMatchIndex.trackVideoByPosition.has(track.position),
      ),
    [playbackMatchIndex, tracks],
  );

  const allPlayableTracksQueued = useMemo(
    () =>
      playableTracks.length === 0 ||
      playableTracks.every((track) => isTrackQueued(track.position)),
    [isTrackQueued, playableTracks],
  );

  const handleAddAllToQueue = useCallback(() => {
    const tracksToQueue = playableTracks.filter(
      (track) => !isTrackQueued(track.position),
    );

    if (tracksToQueue.length === 0) {
      return;
    }

    if (!playback.isMiniPlayerVisible) {
      const firstTrack = tracksToQueue[0];

      if (!firstTrack) {
        return;
      }

      playback.startPlayback({
        release,
        trackPosition: firstTrack.position,
        trackTitle: firstTrack.title,
        ...(playback.autoPlayOnQueueAdd ? {} : { startPaused: true }),
        rebuildAlbumQueue: false,
      });

      for (const track of tracksToQueue.slice(1)) {
        playback.addToQueue({
          release,
          trackPosition: track.position,
          trackTitle: track.title,
        });
      }

      return;
    }

    for (const track of tracksToQueue) {
      playback.addToQueue({
        release,
        trackPosition: track.position,
        trackTitle: track.title,
      });
    }
  }, [
    playback.autoPlayOnQueueAdd,
    isTrackQueued,
    playback.addToQueue,
    playback.isMiniPlayerVisible,
    playback.startPlayback,
    playableTracks,
    release,
  ]);

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
    isError: isPlayingThisReleaseInBar ? false : isError,
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
