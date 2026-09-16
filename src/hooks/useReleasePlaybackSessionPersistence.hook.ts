"use client";

import { type MutableRefObject, type RefObject, useEffect } from "react";
import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type { StartPlaybackParams } from "src/types/releasePlaybackContext.types";
import { resolvePersistedQueueItems } from "src/utils/playbackQueue";
import { matchesInstanceId } from "src/utils/releaseNotes";
import {
  clearPersistedReleasePlayback,
  type PersistedReleasePlayback,
  readPersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";

interface UsePersistPlaybackSessionOnQueueChangeParams {
  sessionQueue: PlaybackQueueItem[];
  persistPlaybackSession: () => void;
}

export const usePersistPlaybackSessionOnQueueChange = ({
  sessionQueue,
  persistPlaybackSession,
}: UsePersistPlaybackSessionOnQueueChangeParams): void => {
  useEffect(() => {
    if (sessionQueue) {
      persistPlaybackSession();
    }
  }, [sessionQueue, persistPlaybackSession]);
};

interface UsePersistPlaybackSessionWhilePlayingParams {
  isPlaying: boolean;
  release: DiscogsRelease | null;
  pendingTrackPosition: string | null;
  activeTrackPosition: string | null;
  isReleasePreview: boolean;
  persistPlaybackSession: () => void;
}

export const usePersistPlaybackSessionWhilePlaying = ({
  isPlaying,
  release,
  pendingTrackPosition,
  activeTrackPosition,
  isReleasePreview,
  persistPlaybackSession,
}: UsePersistPlaybackSessionWhilePlayingParams): void => {
  useEffect(() => {
    if (!(isPlaying && release) || pendingTrackPosition) {
      return;
    }

    if (!(activeTrackPosition || isReleasePreview)) {
      return;
    }

    persistPlaybackSession();
  }, [
    activeTrackPosition,
    isPlaying,
    isReleasePreview,
    pendingTrackPosition,
    persistPlaybackSession,
    release,
  ]);
};

interface UseRestorePlaybackSessionParams {
  isPlaying: boolean;
  isCheckingAuth: boolean;
  isAuthenticated: boolean;
  fetchingCollection: boolean;
  collection: { pagination?: { urls?: { next?: string } } } | null;
  allReleases: DiscogsRelease[];
  hasMoreCollectionPages: boolean;
  hasAttemptedRestoreRef: MutableRefObject<boolean>;
  queueManuallyExtendedRef: MutableRefObject<boolean>;
  setUpcomingQueue: (nextQueue: PlaybackQueueItem[]) => void;
  startPlaybackRef: RefObject<(params: StartPlaybackParams) => void>;
}

export const useRestorePlaybackSessionFromStorage = ({
  isPlaying,
  isCheckingAuth,
  isAuthenticated,
  fetchingCollection,
  collection,
  allReleases,
  hasMoreCollectionPages,
  hasAttemptedRestoreRef,
  queueManuallyExtendedRef,
  setUpcomingQueue,
  startPlaybackRef,
}: UseRestorePlaybackSessionParams): void => {
  useEffect(() => {
    if (hasAttemptedRestoreRef.current || isPlaying) {
      return;
    }

    const persisted: PersistedReleasePlayback | null =
      readPersistedReleasePlayback();

    if (!persisted) {
      hasAttemptedRestoreRef.current = true;
      return;
    }

    if (isCheckingAuth) {
      return;
    }

    if (!isAuthenticated) {
      clearPersistedReleasePlayback();
      hasAttemptedRestoreRef.current = true;
      return;
    }

    if (fetchingCollection) {
      return;
    }

    if (collection === null) {
      return;
    }

    const matchingRelease = allReleases.find((collectionRelease) =>
      matchesInstanceId(collectionRelease, persisted.instanceId),
    );

    if (matchingRelease) {
      hasAttemptedRestoreRef.current = true;

      const restoredQueue = resolvePersistedQueueItems({
        items: persisted.queue ?? [],
        releases: allReleases,
      });

      setUpcomingQueue(restoredQueue);
      queueManuallyExtendedRef.current = restoredQueue.length > 0;

      startPlaybackRef.current({
        release: matchingRelease,
        trackPosition: persisted.trackPosition,
        startPaused: true,
        rebuildAlbumQueue: false,
      });
      return;
    }

    if (hasMoreCollectionPages) {
      return;
    }

    clearPersistedReleasePlayback();
    hasAttemptedRestoreRef.current = true;
  }, [
    allReleases,
    collection,
    fetchingCollection,
    hasAttemptedRestoreRef,
    hasMoreCollectionPages,
    isAuthenticated,
    isCheckingAuth,
    isPlaying,
    queueManuallyExtendedRef,
    setUpcomingQueue,
    startPlaybackRef,
  ]);
};
