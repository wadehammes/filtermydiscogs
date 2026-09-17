import { useCallback, useMemo } from "react";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import type { DiscogsRelease } from "src/types";
import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import { isSameQueueItem } from "src/utils/playbackQueue";
import {
  showPlaybackQueueAllQueuedToast,
  showPlaybackQueueSuccessToast,
} from "src/utils/playbackQueueToast";
import { isSameReleaseInstance } from "src/utils/releaseNotes";
import type { ReleasePlaybackMatchIndex } from "src/utils/releasePlayback";

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

  return {
    isTrackQueued,
    isPreviewTrackQueued,
    allPlayableTracksQueued,
    handleAddAllToQueue,
  };
};
