"use client";

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
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  adjustQueueIndexAfterReorder,
  appendQueueItem,
  buildPlayableAlbumQueue,
  createQueueItem,
  findQueueItemIndex,
  removeQueueItemAtIndex,
  reorderQueueItems,
} from "src/utils/playbackQueue";
import {
  isSameReleaseInstance,
  matchesInstanceId,
  parseReleaseId,
} from "src/utils/releaseNotes";
import {
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

interface StartPlaybackParams {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle?: string;
  startPaused?: boolean;
}

interface AddToQueueParams {
  release: DiscogsRelease;
  trackPosition: string;
  trackTitle: string;
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
  isPlaying: boolean;
  isPaused: boolean;
  shouldAutoplayEmbed: boolean;
  isPlaybackReady: boolean;
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  isLoading: boolean;
  startPlayback: (params: StartPlaybackParams) => void;
  addToQueue: (params: AddToQueueParams) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playQueueAtIndex: (index: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  registerPlaybackIframe: (iframe: HTMLIFrameElement | null) => void;
  resumePlaybackFromGesture: () => void;
  stopPlayback: () => void;
}

const ReleasePlaybackContext = createContext<
  ReleasePlaybackContextValue | undefined
>(undefined);

interface ReleasePlaybackProviderProps {
  children: ReactNode;
}

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
  const hasAttemptedRestoreRef = useRef(false);
  const awaitingResumeGestureRef = useRef(false);
  const pendingPlayFromGestureRef = useRef(false);
  const shouldRebuildAlbumQueueRef = useRef(false);
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

  isPausedRef.current = isPaused;
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

  tracksRef.current = tracks;
  releaseDetailIdRef.current = releaseDetail?.id;

  const activeTrack = tracks[activeTrackIndex] ?? null;

  const activeVideo = useMemo(() => {
    if (!activeTrack) {
      return null;
    }

    return findVideoForTrack({ track: activeTrack, videos });
  }, [activeTrack, videos]);

  const activeVideoId = activeVideo
    ? parseYoutubeVideoId(activeVideo.uri)
    : null;

  const activeTrackPosition = activeTrack?.position ?? null;

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
    }

    setPendingTrackPosition(null);
  }, [
    pendingTrackPosition,
    release,
    tracks,
    videos,
    releaseDetail?.id,
    releaseId,
  ]);

  useEffect(() => {
    if (!isPlaying || isLoading || pendingTrackPosition) {
      return;
    }

    if (tracks.length > 0 && activeVideoId === null) {
      setIsPlaying(false);
      clearPersistedReleasePlayback();
    }
  }, [
    activeVideoId,
    isLoading,
    isPlaying,
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
      const item = createQueueItem({
        release: nextRelease,
        trackPosition,
        trackTitle,
      });

      shouldRebuildAlbumQueueRef.current = true;
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

  const addToQueue = useCallback(
    ({ release, trackPosition, trackTitle }: AddToQueueParams) => {
      const item = createQueueItem({ release, trackPosition, trackTitle });
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

  const registerPlaybackIframe = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      playbackIframeRef.current = iframe;

      if (iframe) {
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
      !(isPlaying && release && activeTrackPosition) ||
      pendingTrackPosition
    ) {
      return;
    }

    writePersistedReleasePlayback({
      instanceId: String(release.instance_id),
      trackPosition: activeTrackPosition,
    });
  }, [activeTrackPosition, isPlaying, pendingTrackPosition, release]);

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
      isPlaying,
      isPaused,
      shouldAutoplayEmbed,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
      startPlayback,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      playQueueAtIndex,
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
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
      isPlaying,
      isPaused,
      shouldAutoplayEmbed,
      isPlaybackReady,
      canPlayPrevious,
      canPlayNext,
      isLoading,
      startPlayback,
      addToQueue,
      removeFromQueue,
      reorderQueue,
      playQueueAtIndex,
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
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
