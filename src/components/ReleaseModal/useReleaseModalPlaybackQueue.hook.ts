import { useCallback, useMemo } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import {
  findQueueItemIndex,
  getQueuedTrackPositionsForInstance,
} from "src/utils/playbackQueue";
import {
  showPlaybackQueueAllQueuedToast,
  showPlaybackQueueRemovedToast,
  showPlaybackQueueSuccessToast,
} from "src/utils/playbackQueueToast";
import { isSameReleaseInstance } from "src/utils/releaseNotes";
import {
  getPreviewVideoUriFromPosition,
  parseYoutubeVideoId,
  type ReleasePlaybackMatchIndex,
} from "src/utils/releasePlayback";

interface UseReleaseModalPlaybackQueueParams {
  release: DiscogsRelease;
  tracks: DiscogsTrack[];
  playbackMatchIndex: ReleasePlaybackMatchIndex;
}

export const useReleaseModalPlaybackQueue = ({
  release,
  tracks,
  playbackMatchIndex,
}: UseReleaseModalPlaybackQueueParams) => {
  const playback = useReleasePlayback();
  const releaseInstanceId = String(release.instance_id);

  const queuedTrackPositionsForRelease = useMemo(
    () => getQueuedTrackPositionsForInstance(playback.queue, releaseInstanceId),
    [playback.queue, releaseInstanceId],
  );

  const isQueuePositionActive = useCallback(
    (trackPosition: string, mode: "track" | "preview") => {
      if (!isSameReleaseInstance(release, playback.release)) {
        return false;
      }

      if (mode === "preview") {
        if (!(playback.isReleasePreview && playback.activeVideoId)) {
          return false;
        }

        const previewVideoUri = getPreviewVideoUriFromPosition(trackPosition);

        if (!previewVideoUri) {
          return false;
        }

        return parseYoutubeVideoId(previewVideoUri) === playback.activeVideoId;
      }

      return (
        !playback.isReleasePreview &&
        playback.isMiniPlayerVisible &&
        playback.activeTrackPosition === trackPosition
      );
    },
    [
      playback.activeTrackPosition,
      playback.activeVideoId,
      playback.isMiniPlayerVisible,
      playback.isReleasePreview,
      playback.release,
      release,
    ],
  );

  const isQueuedForRelease = useCallback(
    (trackPosition: string) =>
      queuedTrackPositionsForRelease.has(trackPosition),
    [queuedTrackPositionsForRelease],
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
      showPlaybackQueueAllQueuedToast();
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

      showPlaybackQueueSuccessToast(tracksToQueue.length);
      return;
    }

    for (const track of tracksToQueue) {
      playback.addToQueue({
        release,
        trackPosition: track.position,
        trackTitle: track.title,
      });
    }

    showPlaybackQueueSuccessToast(tracksToQueue.length);
  }, [
    playback.autoPlayOnQueueAdd,
    isTrackQueued,
    playback.addToQueue,
    playback.isMiniPlayerVisible,
    playback.startPlayback,
    playableTracks,
    release,
  ]);

  const handleRemoveAllFromQueue = useCallback(() => {
    const tracksToRemove = playableTracks.filter((track) =>
      isTrackQueued(track.position),
    );

    if (tracksToRemove.length === 0) {
      return;
    }

    playback.removeAlbumTracksFromQueue({
      release,
      trackPositions: tracksToRemove.map((track) => track.position),
    });

    if (
      playback.activeTrackPosition !== null &&
      isQueuePositionActive(playback.activeTrackPosition, "track")
    ) {
      playback.stopPlayback();
    }

    showPlaybackQueueRemovedToast(tracksToRemove.length);
  }, [
    isQueuePositionActive,
    isTrackQueued,
    playback.activeTrackPosition,
    playback.removeAlbumTracksFromQueue,
    playback.stopPlayback,
    playableTracks,
    release,
  ]);

  const unqueueTrackPosition = useCallback(
    (trackPosition: string, mode: "track" | "preview") => {
      if (isQueuePositionActive(trackPosition, mode)) {
        return;
      }

      if (!isQueuedForRelease(trackPosition)) {
        return;
      }

      const queueIndex = findQueueItemIndex(playback.queue, {
        instanceId: String(release.instance_id),
        trackPosition,
      });

      if (queueIndex < 0) {
        return;
      }

      playback.removeFromQueue(queueIndex);
      showPlaybackQueueRemovedToast(1);
    },
    [
      isQueuePositionActive,
      isQueuedForRelease,
      playback.queue,
      playback.removeFromQueue,
      release.instance_id,
    ],
  );

  return {
    isTrackQueued,
    isTrackUnqueueable: isQueuedForRelease,
    isPreviewTrackQueued,
    isPreviewTrackUnqueueable: isQueuedForRelease,
    allPlayableTracksQueued,
    handleAddAllToQueue,
    handleRemoveAllFromQueue,
    handleTrackUnqueue: (trackPosition: string) =>
      unqueueTrackPosition(trackPosition, "track"),
    handlePreviewTrackUnqueue: (trackPosition: string) =>
      unqueueTrackPosition(trackPosition, "preview"),
  };
};
