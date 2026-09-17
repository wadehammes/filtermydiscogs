"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useReleasePlaybackPendingResolution } from "src/hooks/useReleasePlaybackPendingResolution.hook";
import { useReleasePlaybackQueueActions } from "src/hooks/useReleasePlaybackQueueActions.hook";
import { useReleasePlaybackQueueCoordination } from "src/hooks/useReleasePlaybackQueueCoordination.hook";
import { useReleasePlaybackReleaseDetail } from "src/hooks/useReleasePlaybackReleaseDetail.hook";
import {
  usePersistPlaybackSessionOnQueueChange,
  usePersistPlaybackSessionWhilePlaying,
  useRestorePlaybackSessionFromStorage,
} from "src/hooks/useReleasePlaybackSessionPersistence.hook";
import {
  createSimilarQueueMode,
  type SimilarQueueMode,
  useReleasePlaybackSimilarQueue,
} from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import { useReleasePlaybackTransportToggle } from "src/hooks/useReleasePlaybackTransportToggle.hook";
import { useReleasePlaybackYoutubeEmbed } from "src/hooks/useReleasePlaybackYoutubeEmbed.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackState,
  StartPlaybackParams,
} from "src/types/releasePlaybackContext.types";
import { DEFAULT_AUTO_PLAY_ON_QUEUE_ADD } from "src/types/userPreferences.types";
import {
  getSessionRelease,
  initialPlaybackSessionState,
  playbackSessionReducer,
  selectIsMiniPlayerVisible,
  selectIsPaused,
  selectIsPlaying,
} from "src/utils/playbackSessionState";
import {
  resolveActivePlaybackTitle,
  resolveActivePlaybackVideo,
  resolveActiveTrackPosition,
  resolveActiveVideoId,
  resolveIsPlaybackReady,
  resolvePlaybackVideoId,
} from "src/utils/releasePlaybackActivePresentation";
import { createPlaybackEndedAdvanceHandler } from "src/utils/releasePlaybackEndedAdvance";
import { syncPlaybackSessionRefs } from "src/utils/syncPlaybackSessionRefs";

export const useReleasePlaybackProvider = (): {
  actionsValue: ReleasePlaybackActions;
  isMiniPlayerVisible: boolean;
  queue: PlaybackQueueItem[];
  stateValue: ReleasePlaybackState;
} => {
  const { state: authState } = useAuth();
  const { isAuthenticated, isCheckingAuth } = authState;
  const {
    state: { fetchingCollection, collection },
  } = useCollectionContext();
  const { data: collectionQueryData, hasNextPage: queryHasNextPage } =
    useDiscogsCollectionQuery({
      username: authState.username || "",
      enabled: false,
    });
  const hasMoreCollectionPages =
    (collectionQueryData?.pages.length ?? 0) > 0
      ? queryHasNextPage
      : Boolean(collection?.pagination?.urls?.next);
  const allReleases = useAllReleases();
  const queryClient = useQueryClient();
  const { data: userPreferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: isAuthenticated,
  });
  const autoPlayOnQueueAdd =
    userPreferences?.autoPlayOnQueueAdd ?? DEFAULT_AUTO_PLAY_ON_QUEUE_ADD;
  const [session, dispatchSession] = useReducer(
    playbackSessionReducer,
    initialPlaybackSessionState,
  );
  const release = getSessionRelease(session);
  const queue = session.queue;
  const playbackHistory = session.playbackHistory;
  const activeTrackIndex = session.activeTrackIndex;
  const previewVideo = session.kind === "idle" ? null : session.previewVideo;
  const pendingTrackPosition = session.pendingTrackPosition;
  const pendingPreviewVideoUri = session.pendingPreviewVideoUri;
  const isPlaying = selectIsPlaying(session);
  const isPaused = selectIsPaused(session);
  const [shouldAutoplayEmbed, setShouldAutoplayEmbed] = useState(false);
  const [isPlaybackEmbedMounted, setIsPlaybackEmbedMounted] = useState(false);
  const [embedVideoId, setEmbedVideoId] = useState<string | null>(null);
  const hasAttemptedRestoreRef = useRef(false);
  const awaitingResumeGestureRef = useRef(false);
  const pendingPlayFromGestureRef = useRef(false);
  const shouldRebuildAlbumQueueRef = useRef(false);
  const similarQueueModeRef = useRef<SimilarQueueMode>(
    createSimilarQueueMode(false),
  );
  const similarQueueGenerationRef = useRef(0);
  const similarQueueFetchInFlightRef = useRef(false);
  const queueManuallyExtendedRef = useRef(false);
  const playFromGestureRetryTimeoutsRef = useRef<number[]>([]);
  const playbackIframeRef = useRef<HTMLIFrameElement | null>(null);
  const embedVideoIdRef = useRef<string | null>(null);
  const lastSyncedActiveVideoIdRef = useRef<string | null>(null);
  const isPausedRef = useRef(isPaused);
  const releaseRef = useRef<DiscogsRelease | null>(null);
  const queueRef = useRef(queue);
  const playbackHistoryRef = useRef(playbackHistory);
  const autoPlayOnQueueAddRef = useRef(autoPlayOnQueueAdd);
  const tracksRef = useRef<DiscogsTrack[]>([]);
  const videosRef = useRef<DiscogsVideo[]>([]);
  const activeTrackIndexRef = useRef(activeTrackIndex);
  const releaseDetailIdRef = useRef<number | undefined>(undefined);
  const startPlaybackRef = useRef<(params: StartPlaybackParams) => void>(
    () => undefined,
  );
  const playNextRef = useRef<() => void>(() => undefined);
  const extendQueueTailRef = useRef<() => Promise<boolean>>(async () => false);
  const isPlayingRef = useRef(isPlaying);
  const previewVideoRef = useRef<DiscogsVideo | null>(null);

  autoPlayOnQueueAddRef.current = autoPlayOnQueueAdd;
  syncPlaybackSessionRefs(session, {
    release: releaseRef,
    queue: queueRef,
    playbackHistory: playbackHistoryRef,
    activeTrackIndex: activeTrackIndexRef,
    previewVideo: previewVideoRef,
    isPlaying: isPlayingRef,
    isPaused: isPausedRef,
  });

  const {
    abortUnresolvedPlayback,
    maybePushCurrentToHistory,
    persistPlaybackSession,
    prependCurrentToUpcoming,
    setUpcomingQueue,
    tryAutoStartOnEmptyQueue,
    updateUpcomingQueue,
  } = useReleasePlaybackQueueCoordination({
    autoPlayOnQueueAddRef,
    dispatchSession,
    embedVideoIdRef,
    isPlayingRef,
    lastSyncedActiveVideoIdRef,
    previewVideoRef,
    queueRef,
    releaseRef,
    sessionQueue: session.queue,
    activeTrackIndexRef,
    tracksRef,
    setEmbedVideoId,
    setShouldAutoplayEmbed,
  });

  usePersistPlaybackSessionOnQueueChange({
    sessionQueue: session.queue,
    persistPlaybackSession,
  });

  const {
    appendSimilarReleasesToQueue,
    extendQueueTail,
    maybeExtendQueueTail,
    isSimilarQueueLoading,
  } = useReleasePlaybackSimilarQueue({
    queryClient,
    allReleases,
    updateUpcomingQueue,
    refs: {
      queueRef,
      previewVideoRef,
      similarQueueModeRef,
      similarQueueGenerationRef,
      similarQueueFetchInFlightRef,
    },
  });

  const {
    isLoading,
    playbackMatchIndex,
    releaseDetailId,
    releaseId,
    tracks,
    videos,
  } = useReleasePlaybackReleaseDetail({
    release,
    isPlaying,
    tracksRef,
    videosRef,
    releaseDetailIdRef,
  });

  const activeTrack = tracks[activeTrackIndex] ?? null;

  const activeVideo = useMemo(
    () =>
      resolveActivePlaybackVideo({
        previewVideo,
        activeTrack,
        videos,
        playbackMatchIndex,
      }),
    [activeTrack, playbackMatchIndex, previewVideo, videos],
  );

  const activeVideoId = resolveActiveVideoId(activeVideo);

  const isReleasePreview = previewVideo !== null;

  const activePlaybackTitle = resolveActivePlaybackTitle({
    isReleasePreview,
    previewTitle: activeVideo?.title ?? null,
    trackTitle: activeTrack?.title ?? null,
  });

  const activeTrackPosition = resolveActiveTrackPosition({
    isReleasePreview,
    trackPosition: activeTrack?.position ?? null,
  });

  const isMiniPlayerVisible = selectIsMiniPlayerVisible(session);

  const playbackVideoId = useMemo(
    () =>
      resolvePlaybackVideoId({
        pendingTrackPosition,
        pendingPreviewVideoUri,
        embedVideoId,
        activeVideoId,
      }),
    [activeVideoId, embedVideoId, pendingPreviewVideoUri, pendingTrackPosition],
  );

  const isPlaybackReady = resolveIsPlaybackReady({
    isPlaying,
    playbackVideoId,
  });

  const canPlayPrevious = isPlaybackReady && playbackHistory.length > 0;
  const canPlayNext = isPlaybackReady && queue.length > 0;

  const handlePlaybackEnded = useMemo(
    () =>
      createPlaybackEndedAdvanceHandler({
        isPlayingRef,
        isPausedRef,
        queueRef,
        extendQueueTailRef,
        playNextRef,
      }),
    [],
  );

  const {
    clearPlayFromGestureRetries,
    schedulePlayFromGestureAttempts,
    syncEmbedToVideoId,
    syncEmbedForQueueItem,
    prefetchQueueItemEmbed,
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    resumePlaybackFromGesture,
  } = useReleasePlaybackYoutubeEmbed({
    queryClient,
    dispatchSession,
    refs: {
      playbackIframeRef,
      embedVideoIdRef,
      lastSyncedActiveVideoIdRef,
      isPlayingRef,
      isPausedRef,
      pendingPlayFromGestureRef,
      playFromGestureRetryTimeoutsRef,
      releaseRef,
      tracksRef,
      videosRef,
    },
    isPlaying,
    isPaused,
    isPlaybackReady,
    isPlaybackEmbedMounted,
    activeVideoId,
    pendingTrackPosition,
    pendingPreviewVideoUri,
    releaseId,
    releaseDetailId,
    setEmbedVideoId,
    setShouldAutoplayEmbed,
    setIsPlaybackEmbedMounted,
    onPlaybackEnded: handlePlaybackEnded,
  });

  useEffect(() => {
    return () => {
      clearPlayFromGestureRetries();
    };
  }, [clearPlayFromGestureRetries]);

  const {
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
  } = useReleasePlaybackQueueActions({
    dispatchSession,
    setShouldAutoplayEmbed,
    setIsPlaybackEmbedMounted,
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
    refs: {
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
      embedVideoIdRef,
    },
  });

  useReleasePlaybackPendingResolution({
    abortUnresolvedPlayback,
    activeTrackIndex,
    activeVideoId,
    embedVideoId,
    appendSimilarReleasesToQueue,
    awaitingResumeGestureRef,
    dispatchSession,
    isLoading,
    isPlaying,
    isReleasePreview,
    maybeExtendQueueTail,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    previewVideo,
    release,
    releaseDetailId,
    releaseId,
    setUpcomingQueue,
    shouldRebuildAlbumQueueRef,
    similarQueueGenerationRef,
    similarQueueModeRef,
    tracks,
    videos,
  });

  const togglePlayback = useReleasePlaybackTransportToggle({
    isPaused,
    dispatchSession,
    playbackIframeRef,
    awaitingResumeGestureRef,
    pendingPlayFromGestureRef,
    schedulePlayFromGestureAttempts,
    clearPlayFromGestureRetries,
  });

  usePersistPlaybackSessionWhilePlaying({
    isPlaying,
    release,
    pendingTrackPosition,
    activeTrackPosition,
    isReleasePreview,
    persistPlaybackSession,
  });

  useRestorePlaybackSessionFromStorage({
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
  });

  const isQueueBuilding =
    isSimilarQueueLoading ||
    (queue.length === 0 && pendingTrackPosition !== null);

  const stateValue = useMemo(
    (): ReleasePlaybackState => ({
      release,
      tracks,
      videos,
      queue,
      autoPlayOnQueueAdd,
      activeTrackIndex,
      activeTrackPosition,
      activeTrack,
      activeVideoId,
      embedVideoId,
      playbackVideoId,
      activePlaybackTitle,
      isReleasePreview,
      isPlaying,
      isPaused,
      isMiniPlayerVisible,
      shouldAutoplayEmbed,
      isPlaybackEmbedMounted,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
      isQueueBuilding,
    }),
    [
      release,
      tracks,
      videos,
      queue,
      autoPlayOnQueueAdd,
      activeTrackIndex,
      activeTrackPosition,
      activeTrack,
      activeVideoId,
      embedVideoId,
      playbackVideoId,
      activePlaybackTitle,
      isReleasePreview,
      isPlaying,
      isPaused,
      isMiniPlayerVisible,
      shouldAutoplayEmbed,
      isPlaybackEmbedMounted,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
      isQueueBuilding,
    ],
  );

  const actionsValue = useMemo(
    (): ReleasePlaybackActions => ({
      startPlayback,
      startReleasePreview,
      addToQueue,
      addPreviewToQueue,
      removeFromQueue,
      reorderQueue,
      playQueueAtIndex,
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
      notifyPlaybackIframeLoaded,
      resumePlaybackFromGesture,
      clearQueue,
      stopPlayback,
    }),
    [
      startPlayback,
      startReleasePreview,
      addToQueue,
      addPreviewToQueue,
      removeFromQueue,
      reorderQueue,
      playQueueAtIndex,
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
      notifyPlaybackIframeLoaded,
      resumePlaybackFromGesture,
      clearQueue,
      stopPlayback,
    ],
  );

  return {
    actionsValue,
    isMiniPlayerVisible,
    queue,
    stateValue,
  };
};
