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
import { useAuth } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import { matchesInstanceId, parseReleaseId } from "src/utils/releaseNotes";
import {
  findPlayableTrackIndex,
  findTrackIndexByPosition,
  findVideoForTrack,
  flattenTracklist,
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
  startPaused?: boolean;
}

interface ReleasePlaybackContextValue {
  release: DiscogsRelease | null;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
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
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  registerPlaybackIframe: (iframe: HTMLIFrameElement | null) => void;
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
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [shouldAutoplayEmbed, setShouldAutoplayEmbed] = useState(false);
  const [pendingTrackPosition, setPendingTrackPosition] = useState<
    string | null
  >(null);
  const hasAttemptedRestoreRef = useRef(false);
  const awaitingResumeGestureRef = useRef(false);
  const playbackIframeRef = useRef<HTMLIFrameElement | null>(null);
  const startPlaybackRef = useRef<(params: StartPlaybackParams) => void>(
    () => undefined,
  );

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

  const canPlayPrevious = useMemo(() => {
    if (!isPlaybackReady) {
      return false;
    }

    return (
      findPlayableTrackIndex({
        tracks,
        videos,
        startIndex: activeTrackIndex,
        direction: -1,
      }) !== null
    );
  }, [activeTrackIndex, isPlaybackReady, tracks, videos]);

  const canPlayNext = useMemo(() => {
    if (!isPlaybackReady) {
      return false;
    }

    return (
      findPlayableTrackIndex({
        tracks,
        videos,
        startIndex: activeTrackIndex,
        direction: 1,
      }) !== null
    );
  }, [activeTrackIndex, isPlaybackReady, tracks, videos]);

  useEffect(() => {
    if (
      !pendingTrackPosition ||
      tracks.length === 0 ||
      releaseId === null ||
      releaseDetail?.id !== releaseId
    ) {
      return;
    }

    const index = findTrackIndexByPosition(tracks, pendingTrackPosition);

    if (index < 0) {
      return;
    }

    setActiveTrackIndex(index);

    if (!awaitingResumeGestureRef.current) {
      setIsPaused(false);
    }

    awaitingResumeGestureRef.current = false;
    setPendingTrackPosition(null);
  }, [pendingTrackPosition, tracks, releaseDetail?.id, releaseId]);

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
    if (tracks.length === 0) {
      return;
    }

    if (activeTrackIndex >= tracks.length) {
      setActiveTrackIndex(0);
      setIsPaused(false);
    }
  }, [activeTrackIndex, tracks.length]);

  const startPlayback = useCallback(
    ({
      release: nextRelease,
      trackPosition,
      startPaused = false,
    }: StartPlaybackParams) => {
      setPendingTrackPosition(trackPosition);
      setRelease(nextRelease);
      setIsPlaying(true);
      setIsPaused(startPaused);
      setShouldAutoplayEmbed(!startPaused);
      awaitingResumeGestureRef.current = startPaused;
      writePersistedReleasePlayback({
        instanceId: String(nextRelease.instance_id),
        trackPosition,
      });
    },
    [],
  );

  const playNext = useCallback(() => {
    const nextIndex = findPlayableTrackIndex({
      tracks,
      videos,
      startIndex: activeTrackIndex,
      direction: 1,
    });

    if (nextIndex === null) {
      setIsPlaying(false);
      clearPersistedReleasePlayback();
      return;
    }

    setActiveTrackIndex(nextIndex);
    setIsPlaying(true);
    setIsPaused(false);
    setShouldAutoplayEmbed(true);
  }, [activeTrackIndex, tracks, videos]);

  const playPrevious = useCallback(() => {
    const previousIndex = findPlayableTrackIndex({
      tracks,
      videos,
      startIndex: activeTrackIndex,
      direction: -1,
    });

    if (previousIndex === null) {
      return;
    }

    setActiveTrackIndex(previousIndex);
    setIsPlaying(true);
    setIsPaused(false);
    setShouldAutoplayEmbed(true);
  }, [activeTrackIndex, tracks, videos]);

  const registerPlaybackIframe = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      playbackIframeRef.current = iframe;
    },
    [],
  );

  const togglePlayback = useCallback(() => {
    if (isPaused) {
      awaitingResumeGestureRef.current = false;
      postYoutubePlayerCommand({
        iframe: playbackIframeRef.current,
        command: "playVideo",
      });
      setIsPaused(false);
      return;
    }

    postYoutubePlayerCommand({
      iframe: playbackIframeRef.current,
      command: "pauseVideo",
    });
    setIsPaused(true);
  }, [isPaused]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    setShouldAutoplayEmbed(false);
    setRelease(null);
    setActiveTrackIndex(0);
    setPendingTrackPosition(null);
    clearPersistedReleasePlayback();
  }, []);

  startPlaybackRef.current = startPlayback;

  useEffect(() => {
    if (!(isPlaying && release && activeTrackPosition)) {
      return;
    }

    writePersistedReleasePlayback({
      instanceId: String(release.instance_id),
      trackPosition: activeTrackPosition,
    });
  }, [activeTrackPosition, isPlaying, release]);

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
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
      stopPlayback,
    }),
    [
      release,
      tracks,
      videos,
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
      playNext,
      playPrevious,
      togglePlayback,
      registerPlaybackIframe,
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
