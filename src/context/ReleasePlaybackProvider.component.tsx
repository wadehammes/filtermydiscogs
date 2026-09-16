"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  trackPlaybackQueued,
  trackPlaybackStarted,
} from "src/analytics/productAnalyticsEvents";
import { SIMILAR_RELEASES_LIMIT } from "src/constants/collection";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import {
  ReleasePlaybackActionsContext,
  ReleasePlaybackQueueContext,
  ReleasePlaybackStateContext,
  ReleasePlaybackVisibilityContext,
} from "src/context/releasePlaybackContexts";
import { useDiscogsCollectionQuery } from "src/hooks/queries/useDiscogsCollectionQuery";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import {
  usePersistPlaybackSessionOnQueueChange,
  usePersistPlaybackSessionWhilePlaying,
  useRestorePlaybackSessionFromStorage,
} from "src/hooks/useReleasePlaybackSessionPersistence.hook";
import { useReleasePlaybackYoutubeEmbed } from "src/hooks/useReleasePlaybackYoutubeEmbed.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  AddPreviewToQueueParams,
  AddToQueueParams,
  ReleasePlaybackActions,
  ReleasePlaybackState,
  StartPlaybackParams,
  StartReleasePreviewParams,
} from "src/types/releasePlaybackContext.types";
import { DEFAULT_AUTO_PLAY_ON_QUEUE_ADD } from "src/types/userPreferences.types";
import {
  appendQueueItem,
  appendUniqueQueueItems,
  buildCurrentQueueItem,
  buildPlayableAlbumQueue,
  collectQueueItemKeys,
  createPreviewQueueItem,
  createQueueItem,
  findQueueItemIndex,
  getQueueItemKey,
  prependQueueItem,
  removeQueueItemAtIndex,
  reorderQueueItems,
  shuffleQueueItems,
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
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  buildReleasePlaybackMatchIndex,
  findTrackIndexByPosition,
  findVideoForTrack,
  flattenTracklist,
  getPreviewTrackPosition,
  parseYoutubeVideoId,
  postYoutubePlayerCommand,
} from "src/utils/releasePlayback";
import {
  clearPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import { getSimilarReleases } from "src/utils/similarReleases";
import { syncPlaybackSessionRefs } from "src/utils/syncPlaybackSessionRefs";

interface PlayQueueItemOptions {
  autoplay?: boolean;
  rebuildAlbumQueue?: boolean;
  startPaused?: boolean;
  youtubeVideoId?: string;
}

interface ReleasePlaybackProviderProps {
  children: ReactNode;
}

const QUEUE_TAIL_EXTEND_THRESHOLD = 2;

interface SimilarQueueMode {
  enabled: boolean;
  initialAppendPending: boolean;
}

const createSimilarQueueMode = (enabled: boolean): SimilarQueueMode => ({
  enabled,
  initialAppendPending: enabled,
});

export const ReleasePlaybackProvider = ({
  children,
}: ReleasePlaybackProviderProps) => {
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

  const fetchSimilarQueueItems = useCallback(
    async ({
      sourceRelease,
      existingQueue,
    }: {
      sourceRelease: DiscogsRelease;
      existingQueue: PlaybackQueueItem[];
    }): Promise<PlaybackQueueItem[]> => {
      const existingKeys = collectQueueItemKeys(existingQueue);
      const excludeInstanceIds = new Set(
        existingQueue.map((item) => item.instanceId),
      );
      let similarReleases = getSimilarReleases({
        releases: allReleases,
        sourceRelease,
        limit: SIMILAR_RELEASES_LIMIT,
        excludeInstanceIds,
      });

      if (similarReleases.length === 0) {
        similarReleases = getSimilarReleases({
          releases: allReleases,
          sourceRelease,
          limit: SIMILAR_RELEASES_LIMIT,
        });
      }

      const releaseQueues = await fetchPlayableQueuesForSimilarReleases({
        similarReleases,
        queryClient,
      });

      const similarItems: PlaybackQueueItem[] = [];

      for (const releaseQueue of releaseQueues) {
        for (const item of releaseQueue) {
          const itemKey = getQueueItemKey(item);

          if (!existingKeys.has(itemKey)) {
            similarItems.push(item);
            existingKeys.add(itemKey);
          }
        }
      }

      return shuffleQueueItems(similarItems);
    },
    [allReleases, queryClient],
  );

  const appendSimilarReleasesToQueue = useCallback(
    async ({
      sourceRelease,
      generation,
      existingQueue = queueRef.current,
    }: {
      sourceRelease: DiscogsRelease;
      generation: number;
      existingQueue?: PlaybackQueueItem[];
    }): Promise<boolean> => {
      const similarItems = await fetchSimilarQueueItems({
        sourceRelease,
        existingQueue,
      });

      if (
        generation !== similarQueueGenerationRef.current ||
        similarItems.length === 0
      ) {
        return false;
      }

      updateUpcomingQueue((previousQueue) =>
        appendUniqueQueueItems(previousQueue, similarItems),
      );
      return true;
    },
    [fetchSimilarQueueItems, updateUpcomingQueue],
  );

  const extendQueueTail = useCallback(async (): Promise<boolean> => {
    if (
      !similarQueueModeRef.current.enabled ||
      previewVideoRef.current !== null ||
      similarQueueFetchInFlightRef.current
    ) {
      return false;
    }

    const currentQueue = queueRef.current;
    const lastItem = currentQueue[currentQueue.length - 1];

    if (!lastItem) {
      return false;
    }

    similarQueueFetchInFlightRef.current = true;

    try {
      return await appendSimilarReleasesToQueue({
        sourceRelease: lastItem.release,
        generation: similarQueueGenerationRef.current,
        existingQueue: currentQueue,
      });
    } finally {
      similarQueueFetchInFlightRef.current = false;
    }
  }, [appendSimilarReleasesToQueue]);

  const maybeExtendQueueTail = useCallback(() => {
    if (
      !similarQueueModeRef.current.enabled ||
      previewVideoRef.current !== null ||
      similarQueueModeRef.current.initialAppendPending ||
      similarQueueFetchInFlightRef.current
    ) {
      return;
    }

    const remainingTracks = queueRef.current.length;

    if (remainingTracks > QUEUE_TAIL_EXTEND_THRESHOLD) {
      return;
    }

    void extendQueueTail();
  }, [extendQueueTail]);

  const releaseId = release ? parseReleaseId(release) : null;

  const { data: releaseDetail, isLoading } = useDiscogsReleaseQuery({
    releaseId: releaseId !== null ? String(releaseId) : "",
    enabled: releaseId !== null && isPlaying,
  });

  const tracks = useMemo(
    () => flattenTracklist(releaseDetail?.tracklist ?? []),
    [releaseDetail?.tracklist],
  );

  const videos = useMemo(
    () => releaseDetail?.videos ?? [],
    [releaseDetail?.videos],
  );

  const playbackMatchIndex = useMemo(
    () => buildReleasePlaybackMatchIndex(tracks, videos),
    [tracks, videos],
  );

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

  const resolveQueueItemPlayback = useCallback(
    (item: PlaybackQueueItem): boolean => {
      const itemReleaseId = parseReleaseId(item.release);

      if (
        itemReleaseId === null ||
        Number(releaseDetailIdRef.current) !== itemReleaseId ||
        tracksRef.current.length === 0
      ) {
        return false;
      }

      const index = findTrackIndexByPosition(
        tracksRef.current,
        item.trackPosition,
      );

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
    [],
  );

  const applyTargetEmbedVideoId = useCallback(
    (videoId: string) => {
      lastSyncedActiveVideoIdRef.current = videoId;
      syncEmbedToVideoId(videoId);
      return videoId;
    },
    [syncEmbedToVideoId],
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

      dispatchSession({
        type: "PLAY_QUEUE_ITEM",
        params: {
          release: item.release,
          startPaused,
          isSameRelease,
          pendingTrackPosition: null,
          pendingPreviewVideoUri: item.previewVideoUri ?? null,
        },
      });

      setShouldAutoplayEmbed(autoplay && !startPaused);
      awaitingResumeGestureRef.current = startPaused;
      pendingPlayFromGestureRef.current = autoplay && !startPaused;

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

      dispatchSession({
        type: "SET_PENDING_TRACK_POSITION",
        position: item.trackPosition,
      });
    },
    [
      applyTargetEmbedVideoId,
      clearPlayFromGestureRetries,
      prefetchQueueItemEmbed,
      resolveQueueItemPlayback,
      syncEmbedForQueueItem,
    ],
  );

  const playUpcomingAtIndex = useCallback(
    (index: number) => {
      const upcoming = queueRef.current;
      const item = upcoming[index];

      if (!item) {
        return;
      }

      maybePushCurrentToHistory();
      setUpcomingQueue(removeQueueItemAtIndex(upcoming, index));
      playQueueItem(item, { autoplay: true });
    },
    [maybePushCurrentToHistory, playQueueItem, setUpcomingQueue],
  );

  const appendManualQueueItem = useCallback(
    (item: PlaybackQueueItem) => {
      queueManuallyExtendedRef.current = true;
      trackPlaybackQueued(item.release.instance_id);
      updateUpcomingQueue((previousQueue) =>
        appendQueueItem(previousQueue, item),
      );
    },
    [updateUpcomingQueue],
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
      maybePushCurrentToHistory,
      playQueueItem,
      playUpcomingAtIndex,
      setUpcomingQueue,
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
    [applyTargetEmbedVideoId],
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
    [setUpcomingQueue],
  );

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextQueue = reorderQueueItems(queueRef.current, fromIndex, toIndex);

      if (nextQueue === queueRef.current) {
        return;
      }

      setUpcomingQueue(nextQueue);
    },
    [setUpcomingQueue],
  );

  const playNext = useCallback(() => {
    const item = queueRef.current[0];

    if (!item) {
      void extendQueueTail().then((extended) => {
        if (extended && queueRef.current[0]) {
          playNextRef.current();
        }
      });
      return;
    }

    maybePushCurrentToHistory();
    setUpcomingQueue(queueRef.current.slice(1));
    playQueueItem(item, { autoplay: true });
  }, [
    extendQueueTail,
    maybePushCurrentToHistory,
    playQueueItem,
    setUpcomingQueue,
  ]);

  const playPrevious = useCallback(() => {
    const previousItem = playbackHistoryRef.current.at(-1);

    if (!previousItem) {
      return;
    }

    if (isPlayingRef.current) {
      prependCurrentToUpcoming();
    }

    const nextHistory = playbackHistoryRef.current.slice(0, -1);
    dispatchSession({ type: "SET_HISTORY", history: nextHistory });
    playQueueItem(previousItem, { autoplay: true, rebuildAlbumQueue: false });
  }, [playQueueItem, prependCurrentToUpcoming]);

  playNextRef.current = playNext;
  extendQueueTailRef.current = extendQueueTail;

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

  const stopPlayback = useCallback(() => {
    pendingPlayFromGestureRef.current = false;
    clearPlayFromGestureRetries();
    shouldRebuildAlbumQueueRef.current = false;
    similarQueueModeRef.current = createSimilarQueueMode(false);
    similarQueueGenerationRef.current += 1;
    queueManuallyExtendedRef.current = false;
    dispatchSession({ type: "STOP" });
    setShouldAutoplayEmbed(false);
    setIsPlaybackEmbedMounted(false);
    setEmbedVideoId(null);
    embedVideoIdRef.current = null;
    lastSyncedActiveVideoIdRef.current = null;
    clearPersistedReleasePlayback();
  }, [clearPlayFromGestureRetries]);

  const clearQueue = useCallback(() => {
    similarQueueModeRef.current = createSimilarQueueMode(false);
    similarQueueGenerationRef.current += 1;
    shouldRebuildAlbumQueueRef.current = false;
    queueManuallyExtendedRef.current = false;
    setUpcomingQueue([]);
  }, [setUpcomingQueue]);

  startPlaybackRef.current = startPlayback;

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

  return (
    <ReleasePlaybackStateContext.Provider value={stateValue}>
      <ReleasePlaybackActionsContext.Provider value={actionsValue}>
        <ReleasePlaybackQueueContext.Provider value={queue}>
          <ReleasePlaybackVisibilityContext.Provider
            value={isMiniPlayerVisible}
          >
            {children}
          </ReleasePlaybackVisibilityContext.Provider>
        </ReleasePlaybackQueueContext.Provider>
      </ReleasePlaybackActionsContext.Provider>
    </ReleasePlaybackStateContext.Provider>
  );
};
