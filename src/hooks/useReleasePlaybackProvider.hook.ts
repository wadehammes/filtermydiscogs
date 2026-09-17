"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { useReleaseDetailPlaybackIndex } from "src/components/ReleaseModal/useReleaseDetailPlaybackIndex.hook";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useReleasePlaybackQueueActions } from "src/hooks/useReleasePlaybackQueueActions.hook";
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
  buildCurrentQueueItem,
  buildPlayableAlbumQueue,
  prependQueueItem,
  upcomingFromAlbumQueue,
} from "src/utils/playbackQueue";
import {
  getSessionRelease,
  initialPlaybackSessionState,
  playbackSessionReducer,
  selectIsMiniPlayerVisible,
  selectIsPaused,
  selectIsPlaying,
} from "src/utils/playbackSessionState";
import { parseReleaseId } from "src/utils/releaseNotes";
import {
  findTrackIndexByPosition,
  findVideoForTrack,
  getPreviewTrackPosition,
  parseYoutubeVideoId,
  postYoutubePlayerCommand,
} from "src/utils/releasePlayback";
import {
  clearPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
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
  }, []);

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
  }, []);

  const setUpcomingQueue = useCallback((nextQueue: PlaybackQueueItem[]) => {
    queueRef.current = nextQueue;
    dispatchSession({ type: "SET_QUEUE", queue: nextQueue });
  }, []);

  const updateUpcomingQueue = useCallback(
    (updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[]) => {
      dispatchSession({ type: "UPDATE_QUEUE", updater });
    },
    [],
  );

  useEffect(() => {
    queueRef.current = session.queue;
  }, [session.queue]);

  usePersistPlaybackSessionOnQueueChange({
    sessionQueue: session.queue,
    persistPlaybackSession,
  });

  const abortUnresolvedPlayback = useCallback(() => {
    dispatchSession({ type: "STOP" });
    setShouldAutoplayEmbed(false);
    setEmbedVideoId(null);
    embedVideoIdRef.current = null;
    lastSyncedActiveVideoIdRef.current = null;
    clearPersistedReleasePlayback();
  }, []);

  const pushCurrentToHistory = useCallback(() => {
    const currentItem = getCurrentQueueItem();

    if (!currentItem) {
      return;
    }

    dispatchSession({ type: "PUSH_HISTORY", item: currentItem });
  }, [getCurrentQueueItem]);

  const maybePushCurrentToHistory = useCallback(() => {
    if (isPlayingRef.current) {
      pushCurrentToHistory();
    }
  }, [pushCurrentToHistory]);

  const prependCurrentToUpcoming = useCallback(() => {
    const currentItem = getCurrentQueueItem();

    if (!currentItem) {
      return;
    }

    updateUpcomingQueue((previousQueue) =>
      prependQueueItem(previousQueue, currentItem),
    );
  }, [getCurrentQueueItem, updateUpcomingQueue]);

  const tryAutoStartOnEmptyQueue = useCallback((start: () => void) => {
    if (
      autoPlayOnQueueAddRef.current &&
      releaseRef.current === null &&
      queueRef.current.length === 0
    ) {
      start();
      return true;
    }

    return false;
  }, []);

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

  const releaseId = release ? parseReleaseId(release) : null;

  const { data: releaseDetail, isLoading } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: releaseId !== null && isPlaying,
  });

  const { tracks, videos, playbackMatchIndex } = useReleaseDetailPlaybackIndex({
    tracklist: releaseDetail?.tracklist,
    videos: releaseDetail?.videos,
  });

  tracksRef.current = tracks;
  videosRef.current = videos;
  releaseDetailIdRef.current = releaseDetail?.id;

  const activeTrack = tracks[activeTrackIndex] ?? null;

  const activeVideo = useMemo(() => {
    if (previewVideo) {
      return previewVideo;
    }

    if (!activeTrack) {
      return null;
    }

    return findVideoForTrack({
      track: activeTrack,
      videos,
      matchIndex: playbackMatchIndex,
    });
  }, [activeTrack, playbackMatchIndex, previewVideo, videos]);

  const activeVideoId = activeVideo
    ? parseYoutubeVideoId(activeVideo.uri)
    : null;

  const isReleasePreview = previewVideo !== null;

  const activePlaybackTitle = isReleasePreview
    ? (activeVideo?.title ?? null)
    : (activeTrack?.title ?? null);

  const activeTrackPosition = isReleasePreview
    ? null
    : (activeTrack?.position ?? null);

  const isPlaybackReady = isPlaying && activeVideoId !== null;
  const isMiniPlayerVisible = selectIsMiniPlayerVisible(session);

  const playbackVideoId = useMemo(() => {
    if (pendingTrackPosition || pendingPreviewVideoUri) {
      return embedVideoId ?? activeVideoId;
    }

    return activeVideoId ?? embedVideoId;
  }, [
    activeVideoId,
    embedVideoId,
    pendingPreviewVideoUri,
    pendingTrackPosition,
  ]);

  const canPlayPrevious = isPlaybackReady && playbackHistory.length > 0;
  const canPlayNext = isPlaybackReady && queue.length > 0;

  const handlePlaybackEnded = useCallback(() => {
    if (!isPlayingRef.current || isPausedRef.current) {
      return;
    }

    if (queueRef.current.length === 0) {
      void extendQueueTailRef.current().then((extended) => {
        if (
          extended &&
          isPlayingRef.current &&
          !isPausedRef.current &&
          queueRef.current.length > 0
        ) {
          playNextRef.current();
        }
      });
      return;
    }

    playNextRef.current();
  }, []);

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
    releaseDetailId: releaseDetail?.id,
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

  useEffect(() => {
    if (!isPlaying || previewVideo !== null) {
      return;
    }

    maybeExtendQueueTail();
  }, [isPlaying, previewVideo, maybeExtendQueueTail]);

  useEffect(() => {
    if (
      !pendingTrackPosition ||
      tracks.length === 0 ||
      releaseId === null ||
      Number(releaseDetail?.id) !== Number(releaseId)
    ) {
      return;
    }

    const index = findTrackIndexByPosition(tracks, pendingTrackPosition);

    if (index < 0) {
      abortUnresolvedPlayback();
      return;
    }

    dispatchSession({
      type: "RESOLVE_PENDING_TRACK",
      index,
      resumeTransport: !awaitingResumeGestureRef.current,
    });

    awaitingResumeGestureRef.current = false;

    if (shouldRebuildAlbumQueueRef.current && release) {
      const albumQueue = buildPlayableAlbumQueue({
        release,
        tracks,
        videos,
        startPosition: pendingTrackPosition,
      });
      const upcoming = upcomingFromAlbumQueue(albumQueue);

      setUpcomingQueue(upcoming);
      shouldRebuildAlbumQueueRef.current = false;

      if (similarQueueModeRef.current.initialAppendPending) {
        similarQueueModeRef.current.initialAppendPending = false;
        void appendSimilarReleasesToQueue({
          sourceRelease: release,
          generation: similarQueueGenerationRef.current,
          existingQueue: upcoming,
        });
      }
    }
  }, [
    abortUnresolvedPlayback,
    appendSimilarReleasesToQueue,
    pendingTrackPosition,
    release,
    setUpcomingQueue,
    tracks,
    videos,
    releaseDetail?.id,
    releaseId,
  ]);

  useEffect(() => {
    if (
      !pendingPreviewVideoUri ||
      videos.length === 0 ||
      releaseId === null ||
      Number(releaseDetail?.id) !== Number(releaseId)
    ) {
      return;
    }

    const video = videos.find((entry) => entry.uri === pendingPreviewVideoUri);

    if (!video) {
      abortUnresolvedPlayback();
      return;
    }

    dispatchSession({ type: "RESOLVE_PREVIEW_VIDEO", video });
  }, [
    abortUnresolvedPlayback,
    pendingPreviewVideoUri,
    releaseDetail?.id,
    releaseId,
    videos,
  ]);

  useEffect(() => {
    if (
      !isPlaying ||
      isLoading ||
      pendingTrackPosition ||
      pendingPreviewVideoUri
    ) {
      return;
    }

    if (tracks.length > 0 && activeVideoId === null && !isReleasePreview) {
      dispatchSession({ type: "SET_TRANSPORT_OFF" });
      clearPersistedReleasePlayback();
    }
  }, [
    activeVideoId,
    isLoading,
    isPlaying,
    isReleasePreview,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    tracks.length,
  ]);

  useEffect(() => {
    if (tracks.length === 0 || pendingTrackPosition) {
      return;
    }

    if (activeTrackIndex >= tracks.length) {
      dispatchSession({ type: "SET_ACTIVE_TRACK_INDEX", index: 0 });
      dispatchSession({ type: "RESUME" });
    }
  }, [activeTrackIndex, pendingTrackPosition, tracks.length]);

  const togglePlayback = useCallback(() => {
    if (isPaused) {
      awaitingResumeGestureRef.current = false;
      pendingPlayFromGestureRef.current = true;
      postYoutubePlayerCommand({
        iframe: playbackIframeRef.current,
        command: "playVideo",
      });
      schedulePlayFromGestureAttempts();
      dispatchSession({ type: "RESUME" });
      return;
    }

    pendingPlayFromGestureRef.current = false;
    clearPlayFromGestureRetries();
    postYoutubePlayerCommand({
      iframe: playbackIframeRef.current,
      command: "pauseVideo",
    });
    dispatchSession({ type: "PAUSE" });
  }, [clearPlayFromGestureRetries, isPaused, schedulePlayFromGestureAttempts]);

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
