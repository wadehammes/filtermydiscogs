"use client";

import { type Dispatch, type RefObject, useCallback } from "react";
import {
  trackPlaybackQueued,
  trackPlaybackStarted,
} from "src/analytics/productAnalyticsEvents";
import {
  createSimilarQueueMode,
  type SimilarQueueMode,
} from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import type { DiscogsRelease, DiscogsTrack } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  AddPreviewToQueueParams,
  AddToQueueParams,
  StartPlaybackParams,
  StartReleasePreviewParams,
} from "src/types/releasePlaybackContext.types";
import {
  appendQueueItem,
  createPreviewQueueItem,
  createQueueItem,
  findQueueItemIndex,
  removeQueueItemAtIndex,
  reorderQueueItems,
} from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { resetPlaybackSkipLogToast } from "src/utils/playbackSkippedTrackToast";
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  findTrackIndexByPosition,
  parseYoutubeVideoId,
} from "src/utils/releasePlayback";
import { resolveNeedsPlaybackVideoSwitch } from "src/utils/releasePlaybackActivePresentation";
import {
  clearPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";

export interface PlayQueueItemOptions {
  autoplay?: boolean;
  rebuildAlbumQueue?: boolean;
  startPaused?: boolean;
  youtubeVideoId?: string;
}

interface QueueActionRefs {
  awaitingResumeGestureRef: RefObject<boolean>;
  pendingPlayFromGestureRef: RefObject<boolean>;
  shouldRebuildAlbumQueueRef: RefObject<boolean>;
  similarQueueModeRef: RefObject<SimilarQueueMode>;
  similarQueueGenerationRef: RefObject<number>;
  queueManuallyExtendedRef: RefObject<boolean>;
  releaseRef: RefObject<DiscogsRelease | null>;
  queueRef: RefObject<PlaybackQueueItem[]>;
  playbackHistoryRef: RefObject<PlaybackQueueItem[]>;
  isPlayingRef: RefObject<boolean>;
  releaseDetailIdRef: RefObject<number | undefined>;
  tracksRef: RefObject<DiscogsTrack[]>;
  lastSyncedActiveVideoIdRef: RefObject<string | null>;
  activeVideoIdRef: RefObject<string | null>;
  embedVideoIdRef: RefObject<string | null>;
}

interface UseReleasePlaybackQueueActionsParams {
  dispatchSession: Dispatch<PlaybackSessionAction>;
  setShouldAutoplayEmbed: (value: boolean) => void;
  setIsPlaybackEmbedMounted: (value: boolean) => void;
  setPlaybackVideoTransitionTargetId: (videoId: string | null) => void;
  setPlaybackVideoUiLoadingTargetId: (videoId: string | null) => void;
  beginPlaybackVideoUiLoading: () => void;
  clearPlaybackVideoUiLoading: () => void;
  setEmbedVideoId: (videoId: string | null) => void;
  clearPlayFromGestureRetries: () => void;
  syncEmbedToVideoId: (videoId: string) => void;
  syncEmbedForQueueItem: (item: PlaybackQueueItem) => string | null;
  prefetchQueueItemEmbed: (item: PlaybackQueueItem) => void;
  setUpcomingQueue: (nextQueue: PlaybackQueueItem[]) => void;
  updateUpcomingQueue: (
    updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[],
  ) => void;
  maybePushCurrentToHistory: () => void;
  prependCurrentToUpcoming: () => void;
  tryAutoStartOnEmptyQueue: (start: () => void) => boolean;
  extendQueueTail: () => Promise<boolean>;
  playNextRef: RefObject<() => void>;
  extendQueueTailRef: RefObject<() => Promise<boolean>>;
  startPlaybackRef: RefObject<(params: StartPlaybackParams) => void>;
  resetPlaybackSkipState?: () => void;
  refs: QueueActionRefs;
}

export const useReleasePlaybackQueueActions = ({
  dispatchSession,
  setShouldAutoplayEmbed,
  setIsPlaybackEmbedMounted,
  setPlaybackVideoTransitionTargetId,
  setPlaybackVideoUiLoadingTargetId,
  beginPlaybackVideoUiLoading,
  clearPlaybackVideoUiLoading,
  setEmbedVideoId,
  clearPlayFromGestureRetries,
  syncEmbedToVideoId,
  syncEmbedForQueueItem,
  prefetchQueueItemEmbed,
  setUpcomingQueue,
  updateUpcomingQueue,
  maybePushCurrentToHistory,
  prependCurrentToUpcoming,
  tryAutoStartOnEmptyQueue,
  extendQueueTail,
  playNextRef,
  extendQueueTailRef,
  startPlaybackRef,
  resetPlaybackSkipState,
  refs,
}: UseReleasePlaybackQueueActionsParams) => {
  const {
    awaitingResumeGestureRef,
    pendingPlayFromGestureRef,
    shouldRebuildAlbumQueueRef,
    similarQueueModeRef,
    similarQueueGenerationRef,
    queueManuallyExtendedRef,
    releaseRef,
    queueRef,
    playbackHistoryRef,
    isPlayingRef,
    releaseDetailIdRef,
    tracksRef,
    lastSyncedActiveVideoIdRef,
    activeVideoIdRef,
    embedVideoIdRef,
  } = refs;

  const findQueueItemResolutionIndex = useCallback(
    (item: PlaybackQueueItem): number => {
      const itemReleaseId = parseReleaseId(item.release);

      if (
        itemReleaseId === null ||
        Number(releaseDetailIdRef.current) !== itemReleaseId ||
        tracksRef.current.length === 0
      ) {
        return -1;
      }

      return findTrackIndexByPosition(tracksRef.current, item.trackPosition);
    },
    [releaseDetailIdRef, tracksRef],
  );

  const resolveQueueItemPlayback = useCallback(
    (item: PlaybackQueueItem): boolean => {
      const index = findQueueItemResolutionIndex(item);

      if (index < 0) {
        return false;
      }

      dispatchSession({
        type: "RESOLVE_PENDING_TRACK",
        index,
        resumeTransport: true,
      });
      return true;
    },
    [dispatchSession, findQueueItemResolutionIndex],
  );

  const applyTargetEmbedVideoId = useCallback(
    (videoId: string) => {
      lastSyncedActiveVideoIdRef.current = videoId;
      syncEmbedToVideoId(videoId);
      return videoId;
    },
    [lastSyncedActiveVideoIdRef, syncEmbedToVideoId],
  );

  const playQueueItem = useCallback(
    (
      item: PlaybackQueueItem,
      {
        startPaused = false,
        autoplay = true,
        rebuildAlbumQueue = false,
        youtubeVideoId,
      }: PlayQueueItemOptions = {},
    ) => {
      shouldRebuildAlbumQueueRef.current = rebuildAlbumQueue;
      const isSameRelease = isSameReleaseInstance(
        releaseRef.current,
        item.release,
      );
      const preparedEmbedVideoId = youtubeVideoId
        ? applyTargetEmbedVideoId(youtubeVideoId)
        : syncEmbedForQueueItem(item);

      if (!preparedEmbedVideoId) {
        prefetchQueueItemEmbed(item);
      }

      releaseRef.current = item.release;

      const resolutionIndex = item.previewVideoUri
        ? -1
        : findQueueItemResolutionIndex(item);
      const pendingTrackPositionForPlay =
        item.previewVideoUri || resolutionIndex >= 0
          ? null
          : item.trackPosition;

      dispatchSession({
        type: "PLAY_QUEUE_ITEM",
        params: {
          release: item.release,
          startPaused,
          isSameRelease,
          pendingTrackPosition: pendingTrackPositionForPlay,
          pendingPreviewVideoUri: item.previewVideoUri ?? null,
        },
      });

      setShouldAutoplayEmbed(autoplay && !startPaused);
      awaitingResumeGestureRef.current = startPaused;
      const needsPlaybackVideoSwitch = resolveNeedsPlaybackVideoSwitch({
        preparedEmbedVideoId,
        activeVideoId: activeVideoIdRef.current,
      });
      pendingPlayFromGestureRef.current =
        autoplay && !startPaused && needsPlaybackVideoSwitch;

      if (autoplay && !startPaused && preparedEmbedVideoId) {
        setPlaybackVideoUiLoadingTargetId(preparedEmbedVideoId);
      }

      if (autoplay && !startPaused && needsPlaybackVideoSwitch) {
        setPlaybackVideoTransitionTargetId(preparedEmbedVideoId);
      }

      if (startPaused) {
        clearPlayFromGestureRetries();
      }

      if (item.previewVideoUri) {
        shouldRebuildAlbumQueueRef.current = false;
        return;
      }

      if (!(isSameRelease || preparedEmbedVideoId)) {
        lastSyncedActiveVideoIdRef.current = null;
      }

      if (!rebuildAlbumQueue && resolveQueueItemPlayback(item)) {
        return;
      }

      if (pendingTrackPositionForPlay === null) {
        dispatchSession({
          type: "SET_PENDING_TRACK_POSITION",
          position: item.trackPosition,
        });
      }
    },
    [
      applyTargetEmbedVideoId,
      awaitingResumeGestureRef,
      clearPlayFromGestureRetries,
      dispatchSession,
      findQueueItemResolutionIndex,
      lastSyncedActiveVideoIdRef,
      pendingPlayFromGestureRef,
      prefetchQueueItemEmbed,
      releaseRef,
      resolveQueueItemPlayback,
      activeVideoIdRef,
      setPlaybackVideoTransitionTargetId,
      setPlaybackVideoUiLoadingTargetId,
      setShouldAutoplayEmbed,
      shouldRebuildAlbumQueueRef,
      syncEmbedForQueueItem,
    ],
  );

  const playUpcomingAtIndex = useCallback(
    (index: number) => {
      const upcoming = queueRef.current;
      const item = upcoming[index];

      if (!item) {
        clearPlaybackVideoUiLoading();
        return;
      }

      maybePushCurrentToHistory();
      setUpcomingQueue(removeQueueItemAtIndex(upcoming, index));
      playQueueItem(item, { autoplay: true });
    },
    [
      maybePushCurrentToHistory,
      playQueueItem,
      queueRef,
      setUpcomingQueue,
      clearPlaybackVideoUiLoading,
    ],
  );

  const appendManualQueueItem = useCallback(
    (item: PlaybackQueueItem) => {
      queueManuallyExtendedRef.current = true;
      trackPlaybackQueued(item.release.instance_id);
      updateUpcomingQueue((previousQueue) =>
        appendQueueItem(previousQueue, item),
      );
    },
    [queueManuallyExtendedRef, updateUpcomingQueue],
  );

  const startPlayback = useCallback(
    ({
      release: nextRelease,
      trackPosition,
      trackTitle = trackPosition,
      startPaused = false,
      rebuildAlbumQueue: rebuildAlbumQueueOption,
      youtubeVideoId,
    }: StartPlaybackParams) => {
      dispatchSession({ type: "CLEAR_PREVIEW_PENDING" });
      const item = createQueueItem({
        release: nextRelease,
        trackPosition,
        trackTitle,
      });

      const preserveQueue =
        queueManuallyExtendedRef.current && queueRef.current.length > 0;
      let nextQueue: PlaybackQueueItem[];
      let rebuildAlbumQueue: boolean;

      if (preserveQueue) {
        const existingIndex = findQueueItemIndex(queueRef.current, item);

        if (existingIndex >= 0) {
          playUpcomingAtIndex(existingIndex);
          return;
        }

        maybePushCurrentToHistory();
        nextQueue = queueRef.current;
        rebuildAlbumQueue = false;
      } else {
        const seedManualQueue = rebuildAlbumQueueOption === false;
        queueManuallyExtendedRef.current = seedManualQueue;
        nextQueue =
          seedManualQueue && queueRef.current.length > 0
            ? queueRef.current
            : [];
        rebuildAlbumQueue = rebuildAlbumQueueOption ?? true;
      }

      shouldRebuildAlbumQueueRef.current = rebuildAlbumQueue;
      similarQueueModeRef.current = createSimilarQueueMode(
        rebuildAlbumQueue && !startPaused,
      );
      similarQueueGenerationRef.current += 1;
      setUpcomingQueue(nextQueue);
      writePersistedReleasePlayback({
        instanceId: String(nextRelease.instance_id),
        trackPosition,
        queue: nextQueue.map(toPersistedQueueItem),
      });
      trackPlaybackStarted(nextRelease.instance_id);
      playQueueItem(item, {
        autoplay: !startPaused,
        rebuildAlbumQueue,
        startPaused,
        ...(youtubeVideoId ? { youtubeVideoId } : {}),
      });
    },
    [
      dispatchSession,
      maybePushCurrentToHistory,
      playQueueItem,
      playUpcomingAtIndex,
      queueManuallyExtendedRef,
      queueRef,
      setUpcomingQueue,
      shouldRebuildAlbumQueueRef,
      similarQueueGenerationRef,
      similarQueueModeRef,
    ],
  );

  const startReleasePreview = useCallback(
    ({ release: nextRelease, video }: StartReleasePreviewParams) => {
      const previewVideoId = parseYoutubeVideoId(video.uri);

      shouldRebuildAlbumQueueRef.current = false;
      similarQueueModeRef.current = createSimilarQueueMode(false);
      similarQueueGenerationRef.current += 1;
      dispatchSession({
        type: "START_RELEASE_PREVIEW",
        params: { release: nextRelease, video },
      });
      releaseRef.current = nextRelease;

      if (previewVideoId) {
        applyTargetEmbedVideoId(previewVideoId);
      }

      setShouldAutoplayEmbed(true);
      awaitingResumeGestureRef.current = false;
      pendingPlayFromGestureRef.current = true;
      trackPlaybackStarted(nextRelease.instance_id);
    },
    [
      applyTargetEmbedVideoId,
      awaitingResumeGestureRef,
      dispatchSession,
      pendingPlayFromGestureRef,
      releaseRef,
      setShouldAutoplayEmbed,
      shouldRebuildAlbumQueueRef,
      similarQueueGenerationRef,
      similarQueueModeRef,
    ],
  );

  const addToQueue = useCallback(
    ({ release: nextRelease, trackPosition, trackTitle }: AddToQueueParams) => {
      if (
        tryAutoStartOnEmptyQueue(() => {
          startPlayback({
            release: nextRelease,
            trackPosition,
            trackTitle,
            rebuildAlbumQueue: false,
          });
        })
      ) {
        return;
      }

      appendManualQueueItem(
        createQueueItem({ release: nextRelease, trackPosition, trackTitle }),
      );
    },
    [appendManualQueueItem, startPlayback, tryAutoStartOnEmptyQueue],
  );

  const addPreviewToQueue = useCallback(
    ({ release: nextRelease, video }: AddPreviewToQueueParams) => {
      if (
        tryAutoStartOnEmptyQueue(() => {
          startReleasePreview({ release: nextRelease, video });
        })
      ) {
        return;
      }

      appendManualQueueItem(
        createPreviewQueueItem({ release: nextRelease, video }),
      );
    },
    [appendManualQueueItem, startReleasePreview, tryAutoStartOnEmptyQueue],
  );

  const playQueueAtIndex = useCallback(
    (index: number) => {
      playUpcomingAtIndex(index);
    },
    [playUpcomingAtIndex],
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setUpcomingQueue(removeQueueItemAtIndex(queueRef.current, index));
    },
    [queueRef, setUpcomingQueue],
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextQueue = reorderQueueItems(queueRef.current, fromIndex, toIndex);

      if (nextQueue === queueRef.current) {
        return;
      }

      setUpcomingQueue(nextQueue);
    },
    [queueRef, setUpcomingQueue],
  );

  const playNext = useCallback(() => {
    beginPlaybackVideoUiLoading();
    const item = queueRef.current[0];

    if (!item) {
      void extendQueueTail().then((extended) => {
        if (extended && queueRef.current[0]) {
          playNextRef.current();
          return;
        }

        clearPlaybackVideoUiLoading();
      });
      return;
    }

    maybePushCurrentToHistory();
    setUpcomingQueue(queueRef.current.slice(1));
    playQueueItem(item, { autoplay: true });
  }, [
    beginPlaybackVideoUiLoading,
    clearPlaybackVideoUiLoading,
    extendQueueTail,
    maybePushCurrentToHistory,
    playNextRef,
    playQueueItem,
    queueRef,
    setUpcomingQueue,
  ]);

  const playPrevious = useCallback(() => {
    beginPlaybackVideoUiLoading();
    const previousItem = playbackHistoryRef.current.at(-1);

    if (!previousItem) {
      clearPlaybackVideoUiLoading();
      return;
    }

    if (isPlayingRef.current) {
      prependCurrentToUpcoming();
    }

    const nextHistory = playbackHistoryRef.current.slice(0, -1);
    dispatchSession({ type: "SET_HISTORY", history: nextHistory });
    playQueueItem(previousItem, { autoplay: true, rebuildAlbumQueue: false });
  }, [
    beginPlaybackVideoUiLoading,
    clearPlaybackVideoUiLoading,
    dispatchSession,
    isPlayingRef,
    playbackHistoryRef,
    playQueueItem,
    prependCurrentToUpcoming,
  ]);

  playNextRef.current = playNext;
  extendQueueTailRef.current = extendQueueTail;
  startPlaybackRef.current = startPlayback;

  const stopPlayback = useCallback(() => {
    resetPlaybackSkipLogToast();
    resetPlaybackSkipState?.();
    pendingPlayFromGestureRef.current = false;
    clearPlayFromGestureRetries();
    shouldRebuildAlbumQueueRef.current = false;
    similarQueueModeRef.current = createSimilarQueueMode(false);
    similarQueueGenerationRef.current += 1;
    queueManuallyExtendedRef.current = false;
    dispatchSession({ type: "STOP" });
    setShouldAutoplayEmbed(false);
    setIsPlaybackEmbedMounted(false);
    setPlaybackVideoTransitionTargetId(null);
    clearPlaybackVideoUiLoading();
    setEmbedVideoId(null);
    embedVideoIdRef.current = null;
    lastSyncedActiveVideoIdRef.current = null;
    clearPersistedReleasePlayback();
  }, [
    clearPlayFromGestureRetries,
    clearPlaybackVideoUiLoading,
    dispatchSession,
    embedVideoIdRef,
    lastSyncedActiveVideoIdRef,
    pendingPlayFromGestureRef,
    queueManuallyExtendedRef,
    setEmbedVideoId,
    setIsPlaybackEmbedMounted,
    setPlaybackVideoTransitionTargetId,
    setShouldAutoplayEmbed,
    shouldRebuildAlbumQueueRef,
    similarQueueGenerationRef,
    similarQueueModeRef,
    resetPlaybackSkipState,
  ]);

  const clearQueue = useCallback(() => {
    similarQueueModeRef.current = createSimilarQueueMode(false);
    similarQueueGenerationRef.current += 1;
    shouldRebuildAlbumQueueRef.current = false;
    queueManuallyExtendedRef.current = false;
    setUpcomingQueue([]);
  }, [
    queueManuallyExtendedRef,
    setUpcomingQueue,
    shouldRebuildAlbumQueueRef,
    similarQueueGenerationRef,
    similarQueueModeRef,
  ]);

  return {
    startPlayback,
    startReleasePreview,
    addToQueue,
    addPreviewToQueue,
    playQueueAtIndex,
    removeFromQueue,
    reorderQueue,
    playNext,
    playPrevious,
    stopPlayback,
    clearQueue,
  };
};
