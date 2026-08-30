"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  discogsReleaseQueryOptions,
  useDiscogsReleaseQuery,
} from "src/hooks/queries/useDiscogsReleaseQuery";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  AddPreviewToQueueParams,
  AddToQueueParams,
  ReleasePlaybackActions,
  ReleasePlaybackContextValue,
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
  resolvePersistedQueueItems,
  resolveQueueItemYoutubeVideoId,
  shuffleQueueItems,
  upcomingFromAlbumQueue,
} from "src/utils/playbackQueue";
import {
  isSameReleaseInstance,
  matchesInstanceId,
  parseReleaseId,
} from "src/utils/releaseNotes";
import {
  buildReleasePlaybackMatchIndex,
  findTrackIndexByPosition,
  findVideoForTrack,
  flattenTracklist,
  getPreviewTrackPosition,
  PLAY_FROM_GESTURE_RETRY_DELAYS_MS,
  parseYoutubeVideoId,
  postYoutubePlayerCommand,
} from "src/utils/releasePlayback";
import {
  clearPersistedReleasePlayback,
  readPersistedReleasePlayback,
  toPersistedQueueItem,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { fetchPlayableQueuesForSimilarReleases } from "src/utils/similarReleaseQueue";
import { getSimilarReleases } from "src/utils/similarReleases";
import {
  enableYoutubeIframeListening,
  isYoutubeEmbedOrigin,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

interface PlayQueueItemOptions {
  autoplay?: boolean;
  rebuildAlbumQueue?: boolean;
  startPaused?: boolean;
  youtubeVideoId?: string;
}

const ReleasePlaybackStateContext = createContext<
  ReleasePlaybackState | undefined
>(undefined);

const ReleasePlaybackActionsContext = createContext<
  ReleasePlaybackActions | undefined
>(undefined);

const ReleasePlaybackQueueContext = createContext<
  PlaybackQueueItem[] | undefined
>(undefined);

const ReleasePlaybackVisibilityContext = createContext(false);

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
  const hasMoreCollectionPages = Boolean(collection?.pagination?.urls?.next);
  const allReleases = useAllReleases();
  const queryClient = useQueryClient();
  const { data: userPreferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: isAuthenticated,
  });
  const autoPlayOnQueueAdd =
    userPreferences?.autoPlayOnQueueAdd ?? DEFAULT_AUTO_PLAY_ON_QUEUE_ADD;
  const [release, setRelease] = useState<DiscogsRelease | null>(null);
  const [queue, setQueue] = useState<PlaybackQueueItem[]>([]);
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackQueueItem[]>(
    [],
  );
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldAutoplayEmbed, setShouldAutoplayEmbed] = useState(false);
  const [embedVideoId, setEmbedVideoId] = useState<string | null>(null);
  const [pendingTrackPosition, setPendingTrackPosition] = useState<
    string | null
  >(null);
  const [pendingPreviewVideoUri, setPendingPreviewVideoUri] = useState<
    string | null
  >(null);
  const [previewVideo, setPreviewVideo] = useState<DiscogsVideo | null>(null);
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

  isPausedRef.current = isPaused;
  isPlayingRef.current = isPlaying;
  previewVideoRef.current = previewVideo;
  releaseRef.current = release;
  queueRef.current = queue;
  playbackHistoryRef.current = playbackHistory;
  autoPlayOnQueueAddRef.current = autoPlayOnQueueAdd;
  activeTrackIndexRef.current = activeTrackIndex;

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
    setQueue(nextQueue);
  }, []);

  const updateUpcomingQueue = useCallback(
    (updater: (previousQueue: PlaybackQueueItem[]) => PlaybackQueueItem[]) => {
      setQueue((previousQueue) => {
        const nextQueue = updater(previousQueue);
        queueRef.current = nextQueue;
        return nextQueue;
      });
    },
    [],
  );

  const clearPlaybackHistory = useCallback(() => {
    playbackHistoryRef.current = [];
    setPlaybackHistory([]);
  }, []);

  const abortUnresolvedPlayback = useCallback(() => {
    setPendingTrackPosition(null);
    setPendingPreviewVideoUri(null);
    setIsPlaying(false);
    setIsPaused(false);
    setShouldAutoplayEmbed(false);
    setEmbedVideoId(null);
    embedVideoIdRef.current = null;
    lastSyncedActiveVideoIdRef.current = null;
    setPreviewVideo(null);
    setRelease(null);
    setActiveTrackIndex(0);
    setUpcomingQueue([]);
    clearPlaybackHistory();
    clearPersistedReleasePlayback();
  }, [clearPlaybackHistory, setUpcomingQueue]);

  const pushCurrentToHistory = useCallback(() => {
    const currentItem = getCurrentQueueItem();

    if (!currentItem) {
      return;
    }

    setPlaybackHistory((previousHistory) => {
      const nextHistory = [...previousHistory, currentItem];
      playbackHistoryRef.current = nextHistory;
      return nextHistory;
    });
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

  const clearPlayFromGestureRetries = useCallback(() => {
    for (const timeoutId of playFromGestureRetryTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }

    playFromGestureRetryTimeoutsRef.current = [];
  }, []);

  const attemptPlayFromGesture = useCallback(() => {
    if (!pendingPlayFromGestureRef.current || isPausedRef.current) {
      return;
    }

    postYoutubePlayerCommand({
      iframe: playbackIframeRef.current,
      command: "playVideo",
    });
  }, []);

  const schedulePlayFromGestureAttempts = useCallback(() => {
    clearPlayFromGestureRetries();

    if (!pendingPlayFromGestureRef.current || isPausedRef.current) {
      return;
    }

    for (const delay of PLAY_FROM_GESTURE_RETRY_DELAYS_MS) {
      playFromGestureRetryTimeoutsRef.current.push(
        window.setTimeout(() => {
          attemptPlayFromGesture();
        }, delay),
      );
    }
  }, [attemptPlayFromGesture, clearPlayFromGestureRetries]);

  const syncEmbedToVideoId = useCallback(
    (videoId: string) => {
      embedVideoIdRef.current = videoId;
      setEmbedVideoId(videoId);

      if (!isPausedRef.current) {
        pendingPlayFromGestureRef.current = true;
        schedulePlayFromGestureAttempts();
      }
    },
    [schedulePlayFromGestureAttempts],
  );

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

  const resolveQueueItemEmbedVideoId = useCallback(
    (item: PlaybackQueueItem): string | null => {
      let tracks = tracksRef.current;
      let videos = videosRef.current;

      if (!isSameReleaseInstance(releaseRef.current, item.release)) {
        const itemReleaseId = parseReleaseId(item.release);

        if (itemReleaseId === null) {
          return null;
        }

        const cached = queryClient.getQueryData<DiscogsReleaseDetail>(
          DiscogsReleaseQueryKeys.byId(String(itemReleaseId)),
        );

        if (!cached) {
          return null;
        }

        tracks = flattenTracklist(cached.tracklist ?? []);
        videos = cached.videos ?? [];
      }

      return resolveQueueItemYoutubeVideoId({
        item,
        tracks,
        videos,
      });
    },
    [queryClient],
  );

  const syncEmbedForQueueItem = useCallback(
    (item: PlaybackQueueItem) => {
      const videoId = resolveQueueItemEmbedVideoId(item);

      if (!videoId) {
        return null;
      }

      lastSyncedActiveVideoIdRef.current = videoId;
      syncEmbedToVideoId(videoId);
      return videoId;
    },
    [resolveQueueItemEmbedVideoId, syncEmbedToVideoId],
  );

  const prefetchQueueItemEmbed = useCallback(
    (item: PlaybackQueueItem) => {
      const itemReleaseId = parseReleaseId(item.release);

      if (itemReleaseId === null) {
        return;
      }

      void queryClient
        .fetchQuery(discogsReleaseQueryOptions(String(itemReleaseId)))
        .then((detail) => {
          if (!isSameReleaseInstance(releaseRef.current, item.release)) {
            return;
          }

          const videoId = resolveQueueItemYoutubeVideoId({
            item,
            tracks: flattenTracklist(detail.tracklist ?? []),
            videos: detail.videos ?? [],
          });

          if (
            !videoId ||
            lastSyncedActiveVideoIdRef.current === videoId ||
            embedVideoIdRef.current === videoId
          ) {
            return;
          }

          lastSyncedActiveVideoIdRef.current = videoId;
          syncEmbedToVideoId(videoId);
        });
    },
    [queryClient, syncEmbedToVideoId],
  );

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

  const resumePlaybackFromGesture = useCallback(() => {
    schedulePlayFromGestureAttempts();
  }, [schedulePlayFromGestureAttempts]);

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
  const isMiniPlayerVisible = release !== null;

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

  useEffect(() => {
    return () => {
      clearPlayFromGestureRetries();
    };
  }, [clearPlayFromGestureRetries]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState !== "visible" ||
        !isPlayingRef.current ||
        isPausedRef.current
      ) {
        return;
      }

      schedulePlayFromGestureAttempts();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [schedulePlayFromGestureAttempts]);

  useEffect(() => {
    if (
      !(activeVideoId && isPlaying) ||
      pendingTrackPosition ||
      pendingPreviewVideoUri ||
      releaseId === null ||
      Number(releaseDetail?.id) !== Number(releaseId)
    ) {
      return;
    }

    if (lastSyncedActiveVideoIdRef.current === activeVideoId) {
      return;
    }

    lastSyncedActiveVideoIdRef.current = activeVideoId;
    syncEmbedToVideoId(activeVideoId);
  }, [
    activeVideoId,
    isPlaying,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    releaseDetail?.id,
    releaseId,
    syncEmbedToVideoId,
  ]);

  useEffect(() => {
    if (
      !(activeVideoId && isPlaybackReady && pendingPlayFromGestureRef.current)
    ) {
      return;
    }

    schedulePlayFromGestureAttempts();
  }, [activeVideoId, isPlaybackReady, schedulePlayFromGestureAttempts]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const iframe = playbackIframeRef.current;

      if (
        !iframe?.contentWindow ||
        event.source !== iframe.contentWindow ||
        !isYoutubeEmbedOrigin(event.origin)
      ) {
        return;
      }

      const playerState = parseYoutubePlayerStateFromMessage(event.data);

      if (playerState === null) {
        return;
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_PAUSED &&
        isPlayingRef.current &&
        !isPausedRef.current
      ) {
        pendingPlayFromGestureRef.current = false;
        clearPlayFromGestureRetries();
        setIsPaused(true);
        return;
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_PLAYING &&
        isPlayingRef.current &&
        isPausedRef.current
      ) {
        setIsPaused(false);
        return;
      }

      if (playerState !== YOUTUBE_PLAYER_STATE_ENDED) {
        return;
      }

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
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
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

    setPreviewVideo(null);
    setActiveTrackIndex(index);

    if (!awaitingResumeGestureRef.current) {
      setIsPaused(false);
    }

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

    setPendingTrackPosition(null);
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

    setPreviewVideo(video);
    setPendingPreviewVideoUri(null);
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
      setIsPlaying(false);
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
      setActiveTrackIndex(0);
      setIsPaused(false);
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

      setActiveTrackIndex(index);
      setPendingTrackPosition(null);
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

      setRelease(item.release);
      releaseRef.current = item.release;
      setPreviewVideo(null);
      setPendingPreviewVideoUri(null);

      if (item.previewVideoUri) {
        shouldRebuildAlbumQueueRef.current = false;
        setPendingTrackPosition(null);
        setIsPlaying(true);
        setIsPaused(startPaused);
        setShouldAutoplayEmbed(autoplay && !startPaused);
        awaitingResumeGestureRef.current = startPaused;
        pendingPlayFromGestureRef.current = autoplay && !startPaused;

        if (startPaused) {
          clearPlayFromGestureRetries();
        }

        setPendingPreviewVideoUri(item.previewVideoUri);
        return;
      }

      if (!isSameRelease) {
        setActiveTrackIndex(0);

        if (!preparedEmbedVideoId) {
          lastSyncedActiveVideoIdRef.current = null;
        }
      }

      setIsPlaying(true);
      setIsPaused(startPaused);
      setShouldAutoplayEmbed(autoplay && !startPaused);
      awaitingResumeGestureRef.current = startPaused;
      pendingPlayFromGestureRef.current = autoplay && !startPaused;

      if (startPaused) {
        clearPlayFromGestureRetries();
      }

      if (!rebuildAlbumQueue && resolveQueueItemPlayback(item)) {
        return;
      }

      setPendingTrackPosition(item.trackPosition);
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
      setPreviewVideo(null);
      setPendingPreviewVideoUri(null);
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

      setPreviewVideo(video);
      setPendingPreviewVideoUri(null);
      shouldRebuildAlbumQueueRef.current = false;
      similarQueueModeRef.current = createSimilarQueueMode(false);
      similarQueueGenerationRef.current += 1;
      setRelease(nextRelease);
      releaseRef.current = nextRelease;
      setUpcomingQueue([]);
      clearPlaybackHistory();
      setActiveTrackIndex(0);
      setPendingTrackPosition(null);

      if (previewVideoId) {
        applyTargetEmbedVideoId(previewVideoId);
      }

      setIsPlaying(true);
      setIsPaused(false);
      setShouldAutoplayEmbed(true);
      awaitingResumeGestureRef.current = false;
      pendingPlayFromGestureRef.current = true;
      trackPlaybackStarted(nextRelease.instance_id);
    },
    [applyTargetEmbedVideoId, clearPlaybackHistory, setUpcomingQueue],
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
    setPlaybackHistory(nextHistory);
    playbackHistoryRef.current = nextHistory;
    playQueueItem(previousItem, { autoplay: true, rebuildAlbumQueue: false });
  }, [playQueueItem, prependCurrentToUpcoming]);

  playNextRef.current = playNext;
  extendQueueTailRef.current = extendQueueTail;

  const notifyPlaybackIframeLoaded = useCallback(() => {
    enableYoutubeIframeListening(playbackIframeRef.current);
    schedulePlayFromGestureAttempts();
  }, [schedulePlayFromGestureAttempts]);

  const registerPlaybackIframe = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      playbackIframeRef.current = iframe;

      if (iframe) {
        enableYoutubeIframeListening(iframe);
        schedulePlayFromGestureAttempts();
        return;
      }

      clearPlayFromGestureRetries();
    },
    [clearPlayFromGestureRetries, schedulePlayFromGestureAttempts],
  );

  const togglePlayback = useCallback(() => {
    if (isPaused) {
      awaitingResumeGestureRef.current = false;
      pendingPlayFromGestureRef.current = true;
      postYoutubePlayerCommand({
        iframe: playbackIframeRef.current,
        command: "playVideo",
      });
      schedulePlayFromGestureAttempts();
      setIsPaused(false);
      return;
    }

    pendingPlayFromGestureRef.current = false;
    clearPlayFromGestureRetries();
    postYoutubePlayerCommand({
      iframe: playbackIframeRef.current,
      command: "pauseVideo",
    });
    setIsPaused(true);
  }, [clearPlayFromGestureRetries, isPaused, schedulePlayFromGestureAttempts]);

  const stopPlayback = useCallback(() => {
    pendingPlayFromGestureRef.current = false;
    clearPlayFromGestureRetries();
    shouldRebuildAlbumQueueRef.current = false;
    similarQueueModeRef.current = createSimilarQueueMode(false);
    similarQueueGenerationRef.current += 1;
    queueManuallyExtendedRef.current = false;
    setPreviewVideo(null);
    setPendingPreviewVideoUri(null);
    setIsPlaying(false);
    setIsPaused(false);
    setShouldAutoplayEmbed(false);
    setEmbedVideoId(null);
    embedVideoIdRef.current = null;
    lastSyncedActiveVideoIdRef.current = null;
    setRelease(null);
    setActiveTrackIndex(0);
    setPendingTrackPosition(null);
    setUpcomingQueue([]);
    clearPlaybackHistory();
    clearPersistedReleasePlayback();
  }, [clearPlayFromGestureRetries, clearPlaybackHistory, setUpcomingQueue]);

  const clearQueue = useCallback(() => {
    similarQueueModeRef.current = createSimilarQueueMode(false);
    similarQueueGenerationRef.current += 1;
    shouldRebuildAlbumQueueRef.current = false;
    queueManuallyExtendedRef.current = false;
    setUpcomingQueue([]);
  }, [setUpcomingQueue]);

  startPlaybackRef.current = startPlayback;

  useEffect(() => {
    if (!(isPlaying && release) || pendingTrackPosition) {
      return;
    }

    if (!(activeTrackPosition || isReleasePreview)) {
      return;
    }

    if (queue.length >= 0) {
      persistPlaybackSession();
    }
  }, [
    activeTrackPosition,
    isPlaying,
    isReleasePreview,
    pendingTrackPosition,
    persistPlaybackSession,
    queue,
    release,
  ]);

  useEffect(() => {
    if (hasAttemptedRestoreRef.current || isPlaying) {
      return;
    }

    const persisted = readPersistedReleasePlayback();

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
    hasMoreCollectionPages,
    isAuthenticated,
    isCheckingAuth,
    isPlaying,
    setUpcomingQueue,
  ]);

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

export const useReleasePlaybackState = (): ReleasePlaybackState => {
  const context = useContext(ReleasePlaybackStateContext);

  if (!context) {
    throw new Error(
      "useReleasePlaybackState must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};

export const useReleasePlaybackActions = (): ReleasePlaybackActions => {
  const context = useContext(ReleasePlaybackActionsContext);

  if (!context) {
    throw new Error(
      "useReleasePlaybackActions must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};

export const useIsMiniPlayerVisible = (): boolean => {
  const context = useContext(ReleasePlaybackVisibilityContext);

  if (context === undefined) {
    throw new Error(
      "useIsMiniPlayerVisible must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};

export const useReleasePlaybackQueue = (): {
  queue: PlaybackQueueItem[];
  playQueueAtIndex: ReleasePlaybackActions["playQueueAtIndex"];
  removeFromQueue: ReleasePlaybackActions["removeFromQueue"];
  reorderQueue: ReleasePlaybackActions["reorderQueue"];
  clearQueue: ReleasePlaybackActions["clearQueue"];
} => {
  const queue = useContext(ReleasePlaybackQueueContext);

  if (!queue) {
    throw new Error(
      "useReleasePlaybackQueue must be used within ReleasePlaybackProvider",
    );
  }

  const { playQueueAtIndex, removeFromQueue, reorderQueue, clearQueue } =
    useReleasePlaybackActions();

  return {
    queue,
    playQueueAtIndex,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  };
};

export const useReleasePlaybackIframeActions = (): Pick<
  ReleasePlaybackActions,
  | "registerPlaybackIframe"
  | "notifyPlaybackIframeLoaded"
  | "resumePlaybackFromGesture"
> => {
  const {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    resumePlaybackFromGesture,
  } = useReleasePlaybackActions();

  return {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    resumePlaybackFromGesture,
  };
};

export const useReleasePlayback = (): ReleasePlaybackContextValue => {
  const state = useReleasePlaybackState();
  const actions = useReleasePlaybackActions();

  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};
