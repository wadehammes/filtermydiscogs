"use client";

import { type Dispatch, type RefObject, useCallback, useEffect } from "react";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  buildCurrentQueueItem,
  prependQueueItem,
} from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { getPreviewTrackPosition } from "src/utils/releasePlayback";
import { shouldAutoStartPlaybackOnQueueAdd } from "src/utils/releasePlaybackQueueAutoStart";
import {
  clearPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";

interface UseReleasePlaybackQueueCoordinationParams {
  autoPlayOnQueueAddRef: RefObject<boolean>;
  dispatchSession: Dispatch<PlaybackSessionAction>;
  embedVideoIdRef: RefObject<string | null>;
  isPlayingRef: RefObject<boolean>;
  lastSyncedActiveVideoIdRef: RefObject<string | null>;
  previewVideoRef: RefObject<DiscogsVideo | null>;
  queueRef: RefObject<PlaybackQueueItem[]>;
  releaseRef: RefObject<DiscogsRelease | null>;
  sessionQueue: PlaybackQueueItem[];
  activeTrackIndexRef: RefObject<number>;
  tracksRef: RefObject<DiscogsTrack[]>;
  setEmbedVideoId: (videoId: string | null) => void;
  setShouldAutoplayEmbed: (value: boolean) => void;
}

export const useReleasePlaybackQueueCoordination = ({
  autoPlayOnQueueAddRef,
  dispatchSession,
  embedVideoIdRef,
  isPlayingRef,
  lastSyncedActiveVideoIdRef,
  previewVideoRef,
  queueRef,
  releaseRef,
  sessionQueue,
  activeTrackIndexRef,
  tracksRef,
  setEmbedVideoId,
  setShouldAutoplayEmbed,
}: UseReleasePlaybackQueueCoordinationParams) => {
  const persistPlaybackSession = useCallback(() => {
    const currentRelease = releaseRef.current;

    if (!(isPlayingRef.current && currentRelease)) {
      return;
    }

    const previewVideo = previewVideoRef.current;
    const activeTrack = tracksRef.current[activeTrackIndexRef.current] ?? null;
    const trackPosition = previewVideo
      ? getPreviewTrackPosition(previewVideo)
      : activeTrack?.position;

    if (!trackPosition) {
      return;
    }

    writePersistedReleasePlayback({
      instanceId: String(currentRelease.instance_id),
      trackPosition,
      queue: queueRef.current.map(toPersistedQueueItem),
    });
  }, [
    activeTrackIndexRef,
    isPlayingRef,
    previewVideoRef,
    queueRef,
    releaseRef,
    tracksRef,
  ]);

  const getCurrentQueueItem = useCallback((): PlaybackQueueItem | null => {
    const currentRelease = releaseRef.current;

    if (!currentRelease) {
      return null;
    }

    return buildCurrentQueueItem({
      release: currentRelease,
      previewVideo: previewVideoRef.current,
      activeTrack: tracksRef.current[activeTrackIndexRef.current] ?? null,
    });
  }, [activeTrackIndexRef, previewVideoRef, releaseRef, tracksRef]);

  const setUpcomingQueue = useCallback(
    (nextQueue: PlaybackQueueItem[]) => {
      queueRef.current = nextQueue;
      dispatchSession({ type: "SET_QUEUE", queue: nextQueue });
    },
    [dispatchSession, queueRef],
  );

  const updateUpcomingQueue = useCallback(
    (updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[]) => {
      dispatchSession({ type: "UPDATE_QUEUE", updater });
    },
    [dispatchSession],
  );

  useEffect(() => {
    queueRef.current = sessionQueue;
  }, [queueRef, sessionQueue]);

  const abortUnresolvedPlayback = useCallback(() => {
    dispatchSession({ type: "STOP" });
    setShouldAutoplayEmbed(false);
    setEmbedVideoId(null);
    embedVideoIdRef.current = null;
    lastSyncedActiveVideoIdRef.current = null;
    clearPersistedReleasePlayback();
  }, [
    dispatchSession,
    embedVideoIdRef,
    lastSyncedActiveVideoIdRef,
    setEmbedVideoId,
    setShouldAutoplayEmbed,
  ]);

  const pushCurrentToHistory = useCallback(() => {
    const currentItem = getCurrentQueueItem();

    if (!currentItem) {
      return;
    }

    dispatchSession({ type: "PUSH_HISTORY", item: currentItem });
  }, [dispatchSession, getCurrentQueueItem]);

  const maybePushCurrentToHistory = useCallback(() => {
    if (isPlayingRef.current) {
      pushCurrentToHistory();
    }
  }, [isPlayingRef, pushCurrentToHistory]);

  const prependCurrentToUpcoming = useCallback(() => {
    const currentItem = getCurrentQueueItem();

    if (!currentItem) {
      return;
    }

    updateUpcomingQueue((previousQueue) =>
      prependQueueItem(previousQueue, currentItem),
    );
  }, [getCurrentQueueItem, updateUpcomingQueue]);

  const tryAutoStartOnEmptyQueue = useCallback(
    (start: () => void) => {
      if (
        shouldAutoStartPlaybackOnQueueAdd({
          autoPlayOnQueueAdd: autoPlayOnQueueAddRef.current,
          hasActiveRelease: releaseRef.current !== null,
          queueLength: queueRef.current.length,
        })
      ) {
        start();
        return true;
      }

      return false;
    },
    [autoPlayOnQueueAddRef, queueRef, releaseRef],
  );

  return {
    abortUnresolvedPlayback,
    getCurrentQueueItem,
    maybePushCurrentToHistory,
    persistPlaybackSession,
    prependCurrentToUpcoming,
    setUpcomingQueue,
    tryAutoStartOnEmptyQueue,
    updateUpcomingQueue,
  };
};
