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
import { fetchDiscogsRelease } from "src/api/helpers";
import { SIMILAR_RELEASES_LIMIT } from "src/constants/collection";
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  adjustQueueIndexAfterReorder,
  appendQueueItem,
  appendUniqueQueueItems,
  buildFullPlayableAlbumQueue,
  buildPlayableAlbumQueue,
  collectQueueItemKeys,
  createPreviewQueueItem,
  createQueueItem,
  findQueueItemIndex,
  getQueueItemKey,
  removeQueueItemAtIndex,
  reorderQueueItems,
  shuffleQueueItems,
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
  PLAY_FROM_GESTURE_RETRY_DELAYS_MS,
  parseYoutubeVideoId,
  postYoutubePlayerCommand,
} from "src/utils/releasePlayback";
import {
  clearPersistedReleasePlayback,
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { getSimilarReleases } from "src/utils/similarReleases";
import {
  enableYoutubeIframeListening,
  isYoutubeEmbedOrigin,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_ENDED,
} from "src/utils/youtubeIframeEvents";

interface StartPlaybackParams {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle?: string;
  startPaused?: boolean;
}

interface StartReleasePreviewParams {
  release: DiscogsRelease;
  video: DiscogsVideo;
}

interface AddToQueueParams {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle: string;
}

interface AddPreviewToQueueParams {
  release: DiscogsRelease;
  video: DiscogsVideo;
}

interface PlayQueueItemOptions {
  autoplay?: boolean;
  rebuildAlbumQueue?: boolean;
  startPaused?: boolean;
}

interface ReleasePlaybackContextValue {
  release: DiscogsRelease | null;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
  queue: PlaybackQueueItem[];
  queueIndex: number;
  activeTrackIndex: number;
  activeTrackPosition: string | null;
  activeTrack: DiscogsTrack | null;
  activeVideoId: string | null;
  activePlaybackTitle: string | null;
  isReleasePreview: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  shouldAutoplayEmbed: boolean;
  isPlaybackReady: boolean;
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  isLoading: boolean;
  startPlayback: (params: StartPlaybackParams) => void;
  startReleasePreview: (params: StartReleasePreviewParams) => void;
  addToQueue: (params: AddToQueueParams) => void;
  addPreviewToQueue: (params: AddPreviewToQueueParams) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playQueueAtIndex: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  registerPlaybackIframe: (iframe: HTMLIFrameElement | null) => void;
  notifyPlaybackIframeLoaded: () => void;
  resumePlaybackFromGesture: () => void;
  stopPlayback: () => void;
}

const ReleasePlaybackContext = createContext<
  ReleasePlaybackContextValue | undefined
>(undefined);

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
  const [release, setRelease] = useState<DiscogsRelease | null>(null);
  const [queue, setQueue] = useState<PlaybackQueueItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldAutoplayEmbed, setShouldAutoplayEmbed] = useState(false);
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
  const playFromGestureRetryTimeoutsRef = useRef<number[]>([]);
  const playbackIframeRef = useRef<HTMLIFrameElement | null>(null);
  const isPausedRef = useRef(isPaused);
  const releaseRef = useRef<DiscogsRelease | null>(null);
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const tracksRef = useRef<DiscogsTrack[]>([]);
  const releaseDetailIdRef = useRef<number | undefined>(undefined);
  const startPlaybackRef = useRef<(params: StartPlaybackParams) => void>(
    () => undefined,
  );
  const playQueueItemRef = useRef<
    (item: PlaybackQueueItem, options?: PlayQueueItemOptions) => void
  >(() => undefined);
  const stopPlaybackRef = useRef<() => void>(() => undefined);
  const playNextRef = useRef<() => void>(() => undefined);
  const extendQueueTailRef = useRef<() => Promise<boolean>>(async () => false);
  const isPlayingRef = useRef(isPlaying);
  const previewVideoRef = useRef<DiscogsVideo | null>(null);

  isPausedRef.current = isPaused;
  isPlayingRef.current = isPlaying;
  previewVideoRef.current = previewVideo;
  releaseRef.current = release;
  queueRef.current = queue;
  queueIndexRef.current = queueIndex;

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

      const releaseQueues = await Promise.all(
        similarReleases.map(async (similarRelease) => {
          const similarReleaseId = parseReleaseId(similarRelease);

          if (!similarReleaseId) {
            return [];
          }

          try {
            const detail = await queryClient.fetchQuery({
              queryKey: DiscogsReleaseQueryKeys.byId(String(similarReleaseId)),
              queryFn: () => fetchDiscogsRelease(String(similarReleaseId)),
              staleTime: 5 * 60 * 1000,
            });

            return buildFullPlayableAlbumQueue({
              release: similarRelease,
              tracks: flattenTracklist(detail.tracklist ?? []),
              videos: detail.videos ?? [],
            });
          } catch {
            return [];
          }
        }),
      );

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

      setQueue((previousQueue) =>
        appendUniqueQueueItems(previousQueue, similarItems),
      );
      return true;
    },
    [fetchSimilarQueueItems],
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

    const currentIndex = queueIndexRef.current;
    const remainingTracks = queueRef.current.length - currentIndex - 1;

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

  const canPlayPrevious = isPlaybackReady && queueIndex > 0;
  const canPlayNext = isPlaybackReady && queueIndex < queue.length - 1;

  useEffect(() => {
    return () => {
      clearPlayFromGestureRetries();
    };
  }, [clearPlayFromGestureRetries]);

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

      if (playerState !== YOUTUBE_PLAYER_STATE_ENDED) {
        return;
      }

      if (!isPlayingRef.current || isPausedRef.current) {
        return;
      }

      const currentIndex = queueIndexRef.current;
      const currentQueue = queueRef.current;

      if (currentIndex >= currentQueue.length - 1) {
        void extendQueueTailRef.current().then((extended) => {
          if (
            extended &&
            isPlayingRef.current &&
            !isPausedRef.current &&
            queueIndexRef.current < queueRef.current.length - 1
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
  }, []);

  useEffect(() => {
    if (!isPlaying || previewVideo !== null) {
      return;
    }

    maybeExtendQueueTail();
  }, [isPlaying, previewVideo, queueIndex, queue.length, maybeExtendQueueTail]);

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
      setPendingTrackPosition(null);
      setIsPlaying(false);
      setIsPaused(false);
      setShouldAutoplayEmbed(false);
      setRelease(null);
      setActiveTrackIndex(0);
      setQueue([]);
      setQueueIndex(0);
      clearPersistedReleasePlayback();
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
      const nextIndex = findQueueItemIndex(albumQueue, {
        instanceId: String(release.instance_id),
        trackPosition: pendingTrackPosition,
      });

      setQueue(albumQueue);
      setQueueIndex(nextIndex >= 0 ? nextIndex : 0);
      shouldRebuildAlbumQueueRef.current = false;

      if (similarQueueModeRef.current.initialAppendPending) {
        similarQueueModeRef.current.initialAppendPending = false;
        void appendSimilarReleasesToQueue({
          sourceRelease: release,
          generation: similarQueueGenerationRef.current,
          existingQueue: albumQueue,
        });
      }
    }

    setPendingTrackPosition(null);
  }, [
    appendSimilarReleasesToQueue,
    pendingTrackPosition,
    release,
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
      setPendingPreviewVideoUri(null);
      setIsPlaying(false);
      setIsPaused(false);
      setShouldAutoplayEmbed(false);
      setPreviewVideo(null);
      setRelease(null);
      setQueue([]);
      setQueueIndex(0);
      clearPersistedReleasePlayback();
      return;
    }

    setPreviewVideo(video);
    setPendingPreviewVideoUri(null);
  }, [pendingPreviewVideoUri, releaseDetail?.id, releaseId, videos]);

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

  const playQueueItem = useCallback(
    (
      item: PlaybackQueueItem,
      {
        startPaused = false,
        autoplay = true,
        rebuildAlbumQueue = false,
      }: PlayQueueItemOptions = {},
    ) => {
      shouldRebuildAlbumQueueRef.current = rebuildAlbumQueue;
      const isSameRelease = isSameReleaseInstance(
        releaseRef.current,
        item.release,
      );

      setRelease(item.release);
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
      }

      setIsPlaying(true);
      setIsPaused(startPaused);
      setShouldAutoplayEmbed(autoplay && !startPaused);
      awaitingResumeGestureRef.current = startPaused;
      pendingPlayFromGestureRef.current = autoplay && !startPaused;

      if (startPaused) {
        clearPlayFromGestureRetries();
      }

      writePersistedReleasePlayback({
        instanceId: item.instanceId,
        trackPosition: item.trackPosition,
      });

      if (!rebuildAlbumQueue && resolveQueueItemPlayback(item)) {
        return;
      }

      setPendingTrackPosition(item.trackPosition);
    },
    [clearPlayFromGestureRetries, resolveQueueItemPlayback],
  );

  const startPlayback = useCallback(
    ({
      release: nextRelease,
      trackPosition,
      trackTitle = trackPosition,
      startPaused = false,
    }: StartPlaybackParams) => {
      setPreviewVideo(null);
      setPendingPreviewVideoUri(null);
      const item = createQueueItem({
        release: nextRelease,
        trackPosition,
        trackTitle,
      });

      shouldRebuildAlbumQueueRef.current = true;
      similarQueueModeRef.current = createSimilarQueueMode(!startPaused);
      similarQueueGenerationRef.current += 1;
      setQueue([item]);
      setQueueIndex(0);
      trackPlaybackStarted(nextRelease.instance_id);
      playQueueItem(item, {
        autoplay: !startPaused,
        rebuildAlbumQueue: true,
        startPaused,
      });
    },
    [playQueueItem],
  );

  const startReleasePreview = useCallback(
    ({ release: nextRelease, video }: StartReleasePreviewParams) => {
      setPreviewVideo(video);
      setPendingPreviewVideoUri(null);
      shouldRebuildAlbumQueueRef.current = false;
      similarQueueModeRef.current = createSimilarQueueMode(false);
      similarQueueGenerationRef.current += 1;
      setRelease(nextRelease);
      setQueue([]);
      setQueueIndex(0);
      setActiveTrackIndex(0);
      setPendingTrackPosition(null);
      setIsPlaying(true);
      setIsPaused(false);
      setShouldAutoplayEmbed(true);
      awaitingResumeGestureRef.current = false;
      pendingPlayFromGestureRef.current = true;
      trackPlaybackStarted(nextRelease.instance_id);
    },
    [],
  );

  const addToQueue = useCallback(
    ({ release, trackPosition, trackTitle }: AddToQueueParams) => {
      const item = createQueueItem({ release, trackPosition, trackTitle });
      trackPlaybackQueued(release.instance_id);
      setQueue((previousQueue) => appendQueueItem(previousQueue, item));
    },
    [],
  );

  const addPreviewToQueue = useCallback(
    ({ release, video }: AddPreviewToQueueParams) => {
      const item = createPreviewQueueItem({ release, video });
      trackPlaybackQueued(release.instance_id);
      setQueue((previousQueue) => appendQueueItem(previousQueue, item));
    },
    [],
  );

  const playQueueAtIndex = useCallback(
    (index: number) => {
      const item = queueRef.current[index];

      if (!item) {
        return;
      }

      setQueueIndex(index);
      playQueueItem(item, { autoplay: true });
    },
    [playQueueItem],
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      const previousQueue = queueRef.current;
      const previousIndex = queueIndexRef.current;
      const nextQueue = removeQueueItemAtIndex(previousQueue, index);

      setQueue(nextQueue);

      if (index < previousIndex) {
        setQueueIndex(previousIndex - 1);
        return;
      }

      if (index > previousIndex) {
        return;
      }

      if (nextQueue.length === 0) {
        stopPlaybackRef.current();
        return;
      }

      const nextIndex = Math.min(previousIndex, nextQueue.length - 1);
      const nextItem = nextQueue[nextIndex];

      if (!nextItem) {
        return;
      }

      setQueueIndex(nextIndex);
      playQueueItem(nextItem, { autoplay: true });
    },
    [playQueueItem],
  );

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    const previousQueue = queueRef.current;
    const previousIndex = queueIndexRef.current;
    const nextQueue = reorderQueueItems(previousQueue, fromIndex, toIndex);

    if (nextQueue === previousQueue) {
      return;
    }

    setQueue(nextQueue);
    setQueueIndex(
      adjustQueueIndexAfterReorder({
        queueIndex: previousIndex,
        fromIndex,
        toIndex,
      }),
    );
  }, []);

  const playNext = useCallback(() => {
    playQueueAtIndex(queueIndexRef.current + 1);
  }, [playQueueAtIndex]);

  const playPrevious = useCallback(() => {
    playQueueAtIndex(queueIndexRef.current - 1);
  }, [playQueueAtIndex]);

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
    setPreviewVideo(null);
    setPendingPreviewVideoUri(null);
    setIsPlaying(false);
    setIsPaused(false);
    setShouldAutoplayEmbed(false);
    setRelease(null);
    setActiveTrackIndex(0);
    setPendingTrackPosition(null);
    setQueue([]);
    setQueueIndex(0);
    clearPersistedReleasePlayback();
  }, [clearPlayFromGestureRetries]);

  startPlaybackRef.current = startPlayback;
  playQueueItemRef.current = playQueueItem;
  stopPlaybackRef.current = stopPlayback;

  useEffect(() => {
    if (
      !(isPlaying && release && activeTrackPosition && !isReleasePreview) ||
      pendingTrackPosition
    ) {
      return;
    }

    writePersistedReleasePlayback({
      instanceId: String(release.instance_id),
      trackPosition: activeTrackPosition,
    });
  }, [
    activeTrackPosition,
    isPlaying,
    isReleasePreview,
    pendingTrackPosition,
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
      startPlaybackRef.current({
        release: matchingRelease,
        trackPosition: persisted.trackPosition,
        startPaused: true,
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
  ]);

  const value = useMemo(
    (): ReleasePlaybackContextValue => ({
      release,
      tracks,
      videos,
      queue,
      queueIndex,
      activeTrackIndex,
      activeTrackPosition,
      activeTrack,
      activeVideoId,
      activePlaybackTitle,
      isReleasePreview,
      isPlaying,
      isPaused,
      shouldAutoplayEmbed,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
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
      stopPlayback,
    }),
    [
      release,
      tracks,
      videos,
      queue,
      queueIndex,
      activeTrackIndex,
      activeTrackPosition,
      activeTrack,
      activeVideoId,
      activePlaybackTitle,
      isReleasePreview,
      isPlaying,
      isPaused,
      shouldAutoplayEmbed,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
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
      stopPlayback,
    ],
  );

  return (
    <ReleasePlaybackContext.Provider value={value}>
      {children}
    </ReleasePlaybackContext.Provider>
  );
};

export const useReleasePlayback = (): ReleasePlaybackContextValue => {
  const context = useContext(ReleasePlaybackContext);

  if (!context) {
    throw new Error(
      "useReleasePlayback must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};
