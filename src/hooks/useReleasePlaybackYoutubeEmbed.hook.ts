"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  type Dispatch,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useReleasePlaybackPlayFromGesture } from "src/hooks/useReleasePlaybackPlayFromGesture.hook";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { resolveQueueItemYoutubeVideoId } from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import {
  loadAndPlayYoutubeVideo,
  refreshYoutubeEmbedPlayerLayout,
  requestYoutubeEmbedPlaybackSync,
} from "src/utils/postYoutubePlayerCommand";
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  flattenTracklist,
  postYoutubePlayerCommand,
} from "src/utils/releasePlayback";
import { shouldPersistentIframeOwnEmbedLoad } from "src/utils/releasePlaybackEmbedLoadOwnership";
import {
  isWithinEmbedTrackSwitchGrace,
  nextEmbedTrackSwitchGraceUntil,
  shouldNotifyEmbedPlaybackEnded,
} from "src/utils/releasePlaybackEmbedTiming";
import { resolveQueueItemEmbedTracksVideos } from "src/utils/resolveQueueItemEmbedTracksVideos";
import {
  EMBED_PLAYBACK_ENDED_DEBOUNCE_MS,
  EMBED_TRACK_SWITCH_PAUSE_GRACE_MS,
  enableYoutubeIframeListening,
  HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS,
  isYoutubeEmbedAtOrPastEnd,
  isYoutubeEmbedOrigin,
  parseYoutubeInfoDelivery,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_CUED,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

export interface ReleasePlaybackYoutubeEmbedRefs {
  playbackIframeRef: RefObject<HTMLIFrameElement | null>;
  embedVideoIdRef: RefObject<string | null>;
  lastSyncedActiveVideoIdRef: RefObject<string | null>;
  isPlayingRef: RefObject<boolean>;
  isPausedRef: RefObject<boolean>;
  activeVideoIdRef: RefObject<string | null>;
  isPlaybackVideoUiLoadingRef: RefObject<boolean>;
  pendingPlayFromGestureRef: RefObject<boolean>;
  playbackVideoTransitionTargetIdRef: RefObject<string | null>;
  playbackVideoUiLoadingTargetVideoIdRef: RefObject<string | null>;
  playbackVideoUiLoadingEmbedLoadStartedRef: RefObject<boolean>;
  playFromGestureRetryTimeoutsRef: RefObject<number[]>;
  releaseRef: RefObject<import("src/types").DiscogsRelease | null>;
  tracksRef: RefObject<DiscogsTrack[]>;
  videosRef: RefObject<DiscogsVideo[]>;
}

interface UseReleasePlaybackYoutubeEmbedParams {
  queryClient: QueryClient;
  dispatchSession: Dispatch<PlaybackSessionAction>;
  refs: ReleasePlaybackYoutubeEmbedRefs;
  isPlaying: boolean;
  isPaused: boolean;
  isPlaybackReady: boolean;
  isPlaybackEmbedMounted: boolean;
  activeVideoId: string | null;
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
  releaseId: number | null;
  releaseDetailId: number | undefined;
  setEmbedVideoId: (videoId: string | null) => void;
  setShouldAutoplayEmbed: (value: boolean) => void;
  setIsPlaybackEmbedMounted: (value: boolean) => void;
  clearPlaybackVideoUiLoading: () => void;
  onPlaybackEnded: () => void;
}

export const useReleasePlaybackYoutubeEmbed = ({
  queryClient,
  dispatchSession,
  refs,
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
  clearPlaybackVideoUiLoading,
  onPlaybackEnded,
}: UseReleasePlaybackYoutubeEmbedParams) => {
  const {
    playbackIframeRef,
    embedVideoIdRef,
    lastSyncedActiveVideoIdRef,
    isPlayingRef,
    isPausedRef,
    activeVideoIdRef,
    isPlaybackVideoUiLoadingRef,
    pendingPlayFromGestureRef,
    playbackVideoTransitionTargetIdRef,
    playbackVideoUiLoadingTargetVideoIdRef,
    playbackVideoUiLoadingEmbedLoadStartedRef,
    playFromGestureRetryTimeoutsRef,
    releaseRef,
    tracksRef,
    videosRef,
  } = refs;

  const embedTrackSwitchGraceUntilRef = useRef(0);
  const lastEmbedPlaybackEndedAtRef = useRef(0);

  const notifyEmbedPlaybackEnded = useCallback(() => {
    const now = Date.now();

    if (
      !shouldNotifyEmbedPlaybackEnded({
        lastEndedAtMs: lastEmbedPlaybackEndedAtRef.current,
        nowMs: now,
        debounceMs: EMBED_PLAYBACK_ENDED_DEBOUNCE_MS,
      })
    ) {
      return;
    }

    lastEmbedPlaybackEndedAtRef.current = now;
    onPlaybackEnded();
  }, [onPlaybackEnded]);

  const markEmbedTrackSwitchGrace = useCallback(() => {
    embedTrackSwitchGraceUntilRef.current = nextEmbedTrackSwitchGraceUntil({
      nowMs: Date.now(),
      graceMs: EMBED_TRACK_SWITCH_PAUSE_GRACE_MS,
    });
  }, []);

  const isWithinTrackSwitchGrace = useCallback(() => {
    return isWithinEmbedTrackSwitchGrace(
      embedTrackSwitchGraceUntilRef.current,
      Date.now(),
    );
  }, []);

  const {
    attemptPlayFromGesture,
    clearPlayFromGestureRetries,
    schedulePlayFromGestureAttempts,
  } = useReleasePlaybackPlayFromGesture({
    isPausedRef,
    pendingPlayFromGestureRef,
    playbackIframeRef,
    playFromGestureRetryTimeoutsRef,
  });

  const refreshEmbedPlayerLayout = useCallback(() => {
    refreshYoutubeEmbedPlayerLayout({ iframe: playbackIframeRef.current });
  }, [playbackIframeRef]);

  const syncEmbedPlaybackState = useCallback(() => {
    requestYoutubeEmbedPlaybackSync(playbackIframeRef.current);
  }, [playbackIframeRef]);

  const recoverPlaybackAfterTabVisible = useCallback(() => {
    refreshEmbedPlayerLayout();
    syncEmbedPlaybackState();

    if (!isPausedRef.current) {
      schedulePlayFromGestureAttempts();
    }

    window.setTimeout(() => {
      refreshEmbedPlayerLayout();
      syncEmbedPlaybackState();
    }, 200);
  }, [
    isPausedRef,
    refreshEmbedPlayerLayout,
    schedulePlayFromGestureAttempts,
    syncEmbedPlaybackState,
  ]);

  const syncEmbedToVideoId = useCallback(
    (videoId: string) => {
      const isSameVideo = embedVideoIdRef.current === videoId;
      embedVideoIdRef.current = videoId;
      setEmbedVideoId(videoId);

      if (isPausedRef.current) {
        return;
      }

      if (isSameVideo) {
        pendingPlayFromGestureRef.current = false;
        if (!isPausedRef.current) {
          markEmbedTrackSwitchGrace();
        }
        return;
      }

      markEmbedTrackSwitchGrace();

      if (
        shouldPersistentIframeOwnEmbedLoad({
          isPlaybackEmbedMounted,
          hasRegisteredPlaybackIframe: playbackIframeRef.current !== null,
        })
      ) {
        return;
      }

      pendingPlayFromGestureRef.current = true;
      loadAndPlayYoutubeVideo({
        iframe: playbackIframeRef.current,
        videoId,
      });
      schedulePlayFromGestureAttempts();
    },
    [
      embedVideoIdRef,
      isPausedRef,
      isPlaybackEmbedMounted,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      markEmbedTrackSwitchGrace,
      schedulePlayFromGestureAttempts,
      setEmbedVideoId,
    ],
  );

  const resolveQueueItemEmbedVideoId = useCallback(
    (item: PlaybackQueueItem): string | null => {
      const itemReleaseId = parseReleaseId(item.release);

      if (itemReleaseId === null) {
        return null;
      }

      const cached = queryClient.getQueryData<DiscogsReleaseDetail>(
        DiscogsReleaseQueryKeys.byId(String(itemReleaseId)),
      );

      if (
        !(isSameReleaseInstance(releaseRef.current, item.release) || cached)
      ) {
        return null;
      }

      const { tracks, videos } = resolveQueueItemEmbedTracksVideos({
        item,
        currentRelease: releaseRef.current,
        currentTracks: tracksRef.current,
        currentVideos: videosRef.current,
        cachedReleaseDetail: cached,
      });

      return resolveQueueItemYoutubeVideoId({
        item,
        tracks,
        videos,
      });
    },
    [queryClient, releaseRef, tracksRef, videosRef],
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
    [
      lastSyncedActiveVideoIdRef,
      resolveQueueItemEmbedVideoId,
      syncEmbedToVideoId,
    ],
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
    [
      embedVideoIdRef,
      lastSyncedActiveVideoIdRef,
      queryClient,
      releaseRef,
      syncEmbedToVideoId,
    ],
  );

  const handleYoutubeEmbedPlayerState = useCallback(
    (playerState: number) => {
      if (playerState === YOUTUBE_PLAYER_STATE_ENDED) {
        notifyEmbedPlaybackEnded();
        return;
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_PAUSED &&
        isPlayingRef.current &&
        !isPausedRef.current
      ) {
        if (
          document.visibilityState === "hidden" &&
          !isWithinTrackSwitchGrace()
        ) {
          return;
        }

        if (isWithinTrackSwitchGrace()) {
          postYoutubePlayerCommand({
            iframe: playbackIframeRef.current,
            command: "playVideo",
          });
          return;
        }

        pendingPlayFromGestureRef.current = false;
        clearPlayFromGestureRetries();
        dispatchSession({ type: "PAUSE" });
        return;
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_PLAYING &&
        isPlayingRef.current &&
        isPausedRef.current
      ) {
        dispatchSession({ type: "RESUME" });
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_PLAYING &&
        isPlayingRef.current &&
        !isPausedRef.current
      ) {
        if (
          isPlaybackVideoUiLoadingRef.current &&
          !playbackVideoUiLoadingEmbedLoadStartedRef.current
        ) {
          return;
        }

        pendingPlayFromGestureRef.current = false;
        embedTrackSwitchGraceUntilRef.current = 0;

        if (isPlaybackVideoUiLoadingRef.current) {
          const loadingTarget = playbackVideoUiLoadingTargetVideoIdRef.current;
          if (
            loadingTarget !== null &&
            activeVideoIdRef.current !== loadingTarget
          ) {
            return;
          }

          clearPlaybackVideoUiLoading();
        }

        return;
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_CUED &&
        isPlayingRef.current &&
        !isPausedRef.current &&
        pendingPlayFromGestureRef.current
      ) {
        postYoutubePlayerCommand({
          iframe: playbackIframeRef.current,
          command: "playVideo",
        });
      }
    },
    [
      clearPlayFromGestureRetries,
      dispatchSession,
      isPausedRef,
      isPlayingRef,
      isWithinTrackSwitchGrace,
      notifyEmbedPlaybackEnded,
      activeVideoIdRef,
      clearPlaybackVideoUiLoading,
      isPlaybackVideoUiLoadingRef,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      playbackVideoUiLoadingEmbedLoadStartedRef,
      playbackVideoUiLoadingTargetVideoIdRef,
    ],
  );

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (!isPlayingRef.current) {
        return;
      }

      recoverPlaybackAfterTabVisible();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPlayingRef, recoverPlaybackAfterTabVisible]);

  useEffect(() => {
    if (!isPlaying || isPaused) {
      return;
    }

    const pollHiddenTabPlayerState = () => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      syncEmbedPlaybackState();

      if (isWithinTrackSwitchGrace()) {
        attemptPlayFromGesture();
      }
    };

    const intervalId = window.setInterval(
      pollHiddenTabPlayerState,
      HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    attemptPlayFromGesture,
    isPaused,
    isPlaying,
    isWithinTrackSwitchGrace,
    syncEmbedPlaybackState,
  ]);

  useEffect(() => {
    if (
      !(activeVideoId && isPlaying) ||
      pendingTrackPosition ||
      pendingPreviewVideoUri ||
      releaseId === null ||
      Number(releaseDetailId) !== Number(releaseId) ||
      playbackVideoTransitionTargetIdRef.current !== null ||
      isWithinTrackSwitchGrace()
    ) {
      return;
    }

    if (lastSyncedActiveVideoIdRef.current === activeVideoId) {
      return;
    }

    lastSyncedActiveVideoIdRef.current = activeVideoId;

    if (embedVideoIdRef.current === activeVideoId) {
      return;
    }

    embedVideoIdRef.current = activeVideoId;
    setEmbedVideoId(activeVideoId);
  }, [
    activeVideoId,
    embedVideoIdRef,
    isPlaying,
    setEmbedVideoId,
    lastSyncedActiveVideoIdRef,
    isWithinTrackSwitchGrace,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    playbackVideoTransitionTargetIdRef,
    releaseDetailId,
    releaseId,
  ]);

  useEffect(() => {
    if (
      !(activeVideoId && isPlaybackReady && pendingPlayFromGestureRef.current)
    ) {
      return;
    }

    if (isPlaybackEmbedMounted || playbackIframeRef.current !== null) {
      return;
    }

    schedulePlayFromGestureAttempts();
  }, [
    activeVideoId,
    isPlaybackEmbedMounted,
    isPlaybackReady,
    pendingPlayFromGestureRef,
    playbackIframeRef,
    schedulePlayFromGestureAttempts,
  ]);

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

      const infoDelivery = parseYoutubeInfoDelivery(event.data);

      if (infoDelivery && isYoutubeEmbedAtOrPastEnd(infoDelivery)) {
        notifyEmbedPlaybackEnded();
        return;
      }

      const playerState =
        parseYoutubePlayerStateFromMessage(event.data) ??
        infoDelivery?.playerState ??
        null;

      if (playerState === null) {
        return;
      }

      handleYoutubeEmbedPlayerState(playerState);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [
    handleYoutubeEmbedPlayerState,
    notifyEmbedPlaybackEnded,
    playbackIframeRef,
  ]);

  const resumePlaybackFromGesture = useCallback(() => {
    schedulePlayFromGestureAttempts();
  }, [schedulePlayFromGestureAttempts]);

  const notifyImperativeEmbedLoadStarted = useCallback(() => {
    markEmbedTrackSwitchGrace();
    playbackVideoUiLoadingEmbedLoadStartedRef.current = true;
    schedulePlayFromGestureAttempts();
  }, [
    markEmbedTrackSwitchGrace,
    playbackVideoUiLoadingEmbedLoadStartedRef,
    schedulePlayFromGestureAttempts,
  ]);

  const notifyPlaybackIframeLoaded = useCallback(() => {
    enableYoutubeIframeListening(playbackIframeRef.current);
    schedulePlayFromGestureAttempts();
  }, [playbackIframeRef, schedulePlayFromGestureAttempts]);

  const registerPlaybackIframe = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      const previousIframe = playbackIframeRef.current;

      if (!iframe) {
        if (previousIframe) {
          postYoutubePlayerCommand({
            iframe: previousIframe,
            command: "pauseVideo",
          });
        }

        playbackIframeRef.current = null;
        clearPlayFromGestureRetries();
        return;
      }

      if (previousIframe && previousIframe !== iframe) {
        postYoutubePlayerCommand({
          iframe: previousIframe,
          command: "pauseVideo",
        });
      }

      playbackIframeRef.current = iframe;
      enableYoutubeIframeListening(iframe);

      const isIframeElementSwap =
        previousIframe !== null && previousIframe !== iframe;

      if (
        isPlaybackEmbedMounted &&
        !pendingPlayFromGestureRef.current &&
        !isIframeElementSwap &&
        previousIframe !== null
      ) {
        setShouldAutoplayEmbed(false);
      }

      setIsPlaybackEmbedMounted(true);
    },
    [
      clearPlayFromGestureRetries,
      isPlaybackEmbedMounted,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      setIsPlaybackEmbedMounted,
      setShouldAutoplayEmbed,
    ],
  );

  return {
    clearPlayFromGestureRetries,
    schedulePlayFromGestureAttempts,
    syncEmbedToVideoId,
    syncEmbedForQueueItem,
    prefetchQueueItemEmbed,
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    notifyImperativeEmbedLoadStarted,
    resumePlaybackFromGesture,
  };
};
