"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  type Dispatch,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import { useReleasePlaybackPlayFromGesture } from "src/hooks/useReleasePlaybackPlayFromGesture.hook";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { definedProps } from "src/utils/definedProps";
import {
  selectShouldAttemptPlayFromGestureDuringHiddenPoll,
  selectShouldRunHiddenTabPlayerStatePoll,
  selectShouldRunVisibleTabAudibleSyncPoll,
  tryConfirmPlaybackEmbedFromSignal,
} from "src/utils/playbackEmbedSession";
import {
  getQueueItemKey,
  resolveQueueItemYoutubeVideoId,
} from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { shouldHoldConfirmedEmbedDuringSimilarQueueFetch } from "src/utils/playbackSimilarQueueEmbedGuard";
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
import { isEmbedAlignedForLoadingPlaybackConfirm } from "src/utils/releasePlaybackActivePresentation";
import {
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
  PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS,
  resolveAudibleEmbedConfirmTransport,
} from "src/utils/releasePlaybackEmbedConfirm";
import { shouldPersistentIframeOwnEmbedLoad } from "src/utils/releasePlaybackEmbedLoadOwnership";
import {
  isWithinEmbedTrackSwitchGrace,
  nextEmbedTrackSwitchGraceUntil,
  shouldNotifyEmbedPlaybackEnded,
} from "src/utils/releasePlaybackEmbedTiming";
import {
  shouldIgnoreYoutubeEmbedErrorDuringTrackSwitchGrace,
  shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden,
} from "src/utils/releasePlaybackHiddenTabTransport";
import { resolveQueueItemEmbedTracksVideos } from "src/utils/resolveQueueItemEmbedTracksVideos";
import { creditTrackListenOnEmbedEndedForActiveItem } from "src/utils/userTrackRecording";

const subscribeDocumentVisibility = (onStoreChange: () => void) => {
  document.addEventListener("visibilitychange", onStoreChange);

  return () => {
    document.removeEventListener("visibilitychange", onStoreChange);
  };
};

const getDocumentHidden = (): boolean => document.visibilityState === "hidden";

const getDocumentHiddenServerSnapshot = (): boolean => false;

import {
  EMBED_PLAYBACK_ENDED_DEBOUNCE_MS,
  EMBED_TRACK_SWITCH_PAUSE_GRACE_MS,
  enableYoutubeIframeListening,
  HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS,
  isYoutubeEmbedAtOrPastEnd,
  isYoutubeEmbedOrigin,
  parseYoutubeEmbedReadyFromMessage,
  parseYoutubeInfoDelivery,
  parseYoutubePlayerErrorFromMessage,
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
  matchedActiveVideoIdRef: RefObject<string | null>;
  isPlaybackVideoUiLoadingRef: RefObject<boolean>;
  pendingPlayFromGestureRef: RefObject<boolean>;
  playbackVideoTransitionTargetIdRef: RefObject<string | null>;
  playbackVideoUiLoadingTargetVideoIdRef: RefObject<string | null>;
  playbackVideoUiLoadingEmbedLoadStartedAtMsRef: RefObject<number | null>;
  playbackVideoUiLoadingCycleStartedAtMsRef: RefObject<number | null>;
  embedWatchdogVideoIdRef: RefObject<string | null>;
  embedPlaybackConfirmedRef: RefObject<boolean>;
  similarQueueFetchInFlightRef: RefObject<boolean>;
  playFromGestureRetryTimeoutsRef: RefObject<number[]>;
  lastInfoDeliveryCurrentTimeRef: RefObject<number | undefined>;
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
  isPlaybackVideoUiLoading: boolean;
  activeVideoId: string | null;
  matchedActiveVideoId: string | null;
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
  releaseId: number | null;
  releaseDetailId: number | undefined;
  setEmbedVideoId: (videoId: string | null) => void;
  setShouldAutoplayEmbed: (value: boolean) => void;
  setIsPlaybackEmbedMounted: (value: boolean) => void;
  clearPlaybackVideoUiLoading: () => void;
  onPlaybackEnded: () => void;
  onYoutubeEmbedPlaybackError?: (errorCode: number) => void;
  onEmbedPlaybackConfirmed?: () => void;
  onYoutubeEmbedPlayerReady?: () => void;
  onEmbedTransportPaused?: () => void;
  onImperativeEmbedLoadStarted?: () => void;
  userYoutubeOverridesRef: RefObject<Map<string, string>>;
}

export const useReleasePlaybackYoutubeEmbed = ({
  queryClient,
  dispatchSession,
  refs,
  isPlaying,
  isPaused,
  isPlaybackReady,
  isPlaybackEmbedMounted,
  isPlaybackVideoUiLoading,
  activeVideoId,
  matchedActiveVideoId,
  pendingTrackPosition,
  pendingPreviewVideoUri,
  releaseId,
  releaseDetailId,
  setEmbedVideoId,
  setShouldAutoplayEmbed,
  setIsPlaybackEmbedMounted,
  clearPlaybackVideoUiLoading,
  onPlaybackEnded,
  onYoutubeEmbedPlaybackError,
  onEmbedPlaybackConfirmed,
  onYoutubeEmbedPlayerReady,
  onEmbedTransportPaused,
  onImperativeEmbedLoadStarted,
  userYoutubeOverridesRef,
}: UseReleasePlaybackYoutubeEmbedParams) => {
  const {
    playbackIframeRef,
    embedVideoIdRef,
    lastSyncedActiveVideoIdRef,
    isPlayingRef,
    isPausedRef,
    activeVideoIdRef,
    matchedActiveVideoIdRef,
    isPlaybackVideoUiLoadingRef,
    pendingPlayFromGestureRef,
    playbackVideoTransitionTargetIdRef,
    playbackVideoUiLoadingTargetVideoIdRef,
    playbackVideoUiLoadingEmbedLoadStartedAtMsRef,
    playbackVideoUiLoadingCycleStartedAtMsRef,
    embedWatchdogVideoIdRef,
    embedPlaybackConfirmedRef,
    similarQueueFetchInFlightRef,
    playFromGestureRetryTimeoutsRef,
    lastInfoDeliveryCurrentTimeRef,
    releaseRef,
    tracksRef,
    videosRef,
  } = refs;

  const documentHidden = useSyncExternalStore(
    subscribeDocumentVisibility,
    getDocumentHidden,
    getDocumentHiddenServerSnapshot,
  );

  const embedTrackSwitchGraceUntilRef = useRef(0);
  const embedLoadStateSyncTimeoutRef = useRef<number | null>(null);
  const lastEmbedPlaybackEndedAtRef = useRef(0);

  const notifyEmbedPlaybackEnded = useCallback(() => {
    const now = Date.now();

    if (
      playbackVideoTransitionTargetIdRef.current !== null &&
      isWithinEmbedTrackSwitchGrace(embedTrackSwitchGraceUntilRef.current, now)
    ) {
      return;
    }

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
    creditTrackListenOnEmbedEndedForActiveItem();
    onPlaybackEnded();
  }, [onPlaybackEnded, playbackVideoTransitionTargetIdRef]);

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

  const completeEmbedPlaybackHandshake = useCallback(() => {
    pendingPlayFromGestureRef.current = false;
    embedTrackSwitchGraceUntilRef.current = 0;
    onEmbedPlaybackConfirmed?.();
  }, [onEmbedPlaybackConfirmed, pendingPlayFromGestureRef]);

  const tryConfirmAudibleEmbedPlayback = useCallback(
    ({
      playerState,
      infoDeliveryCurrentTime,
      previousInfoDeliveryCurrentTime,
    }: {
      playerState?: number;
      infoDeliveryCurrentTime?: number;
      previousInfoDeliveryCurrentTime?: number;
    }) => {
      const { playbackIntentActive, transportSessionActive } =
        resolveAudibleEmbedConfirmTransport({
          isPlaying,
          isPlayingRefValue: isPlayingRef.current,
          isPaused: isPausedRef.current,
          pendingPlayFromGesture: pendingPlayFromGestureRef.current,
          awaitingResumeGesture: false,
        });

      if (!playbackIntentActive) {
        return false;
      }

      const confirmed = tryConfirmPlaybackEmbedFromSignal({
        signal: {
          kind: "audible",
          ...definedProps({
            playerState,
            infoDeliveryCurrentTime,
            previousInfoDeliveryCurrentTime,
          }),
        },
        imperativeEmbedLoadStartedAtMs:
          playbackVideoUiLoadingEmbedLoadStartedAtMsRef.current,
        videoUiLoadingCycleStartedAtMs:
          playbackVideoUiLoadingCycleStartedAtMsRef.current,
        nowMs: Date.now(),
        transportSessionActive,
        transportPaused: isPausedRef.current,
        ...definedProps({
          lastInfoDeliveryCurrentTime: lastInfoDeliveryCurrentTimeRef.current,
        }),
      });

      if (!confirmed) {
        return false;
      }

      if (isPlaybackVideoUiLoadingRef.current) {
        if (
          !isEmbedAlignedForLoadingPlaybackConfirm({
            loadingTargetVideoId:
              playbackVideoUiLoadingTargetVideoIdRef.current,
            activeVideoId: activeVideoIdRef.current,
            matchedActiveVideoId: matchedActiveVideoIdRef.current,
            embedVideoId: embedVideoIdRef.current,
            transitionTargetVideoId: playbackVideoTransitionTargetIdRef.current,
            watchdogVideoId: embedWatchdogVideoIdRef.current,
          })
        ) {
          return false;
        }

        clearPlaybackVideoUiLoading();
      }

      completeEmbedPlaybackHandshake();
      return true;
    },
    [
      activeVideoIdRef,
      matchedActiveVideoIdRef,
      clearPlaybackVideoUiLoading,
      completeEmbedPlaybackHandshake,
      embedVideoIdRef,
      embedWatchdogVideoIdRef,
      isPausedRef,
      isPlaybackVideoUiLoadingRef,
      isPlaying,
      isPlayingRef,
      lastInfoDeliveryCurrentTimeRef,
      pendingPlayFromGestureRef,
      playbackVideoTransitionTargetIdRef,
      playbackVideoUiLoadingCycleStartedAtMsRef,
      playbackVideoUiLoadingEmbedLoadStartedAtMsRef,
      playbackVideoUiLoadingTargetVideoIdRef,
    ],
  );

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
    (videoId: string, options?: { forceReload?: boolean }) => {
      const isSameVideo = embedVideoIdRef.current === videoId;
      embedVideoIdRef.current = videoId;
      setEmbedVideoId(videoId);

      if (isPausedRef.current) {
        return;
      }

      if (isSameVideo && !options?.forceReload) {
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
        }) &&
        !options?.forceReload
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

      const cached = queryClient.getQueryData(
        discogsReleaseQueryOptions(String(itemReleaseId)).queryKey,
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

      const userYoutubeIdOverride =
        userYoutubeOverridesRef.current.get(getQueueItemKey(item)) ?? null;

      return resolveQueueItemYoutubeVideoId({
        item,
        tracks,
        videos,
        userYoutubeIdOverride,
      });
    },
    [queryClient, releaseRef, tracksRef, userYoutubeOverridesRef, videosRef],
  );

  const syncEmbedForQueueItem = useCallback(
    (item: PlaybackQueueItem, options?: { forceReload?: boolean }) => {
      const videoId = resolveQueueItemEmbedVideoId(item);

      if (!videoId) {
        return null;
      }

      lastSyncedActiveVideoIdRef.current = videoId;
      syncEmbedToVideoId(videoId, options);
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

          const userYoutubeIdOverride =
            userYoutubeOverridesRef.current.get(getQueueItemKey(item)) ?? null;

          const videoId = resolveQueueItemYoutubeVideoId({
            item,
            tracks: flattenTracklist(detail.tracklist ?? []),
            videos: detail.videos ?? [],
            userYoutubeIdOverride,
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
        })
        .catch(() => undefined);
    },
    [
      embedVideoIdRef,
      lastSyncedActiveVideoIdRef,
      queryClient,
      releaseRef,
      syncEmbedToVideoId,
      userYoutubeOverridesRef,
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
        if (isWithinTrackSwitchGrace()) {
          postYoutubePlayerCommand({
            iframe: playbackIframeRef.current,
            command: "playVideo",
          });
          return;
        }

        if (
          shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden({
            visibilityState: document.visibilityState,
            isWithinTrackSwitchGrace: isWithinTrackSwitchGrace(),
            isPlaybackVideoUiLoading: isPlaybackVideoUiLoadingRef.current,
            hasPlaybackVideoTransitionTarget:
              playbackVideoTransitionTargetIdRef.current !== null,
          })
        ) {
          return;
        }

        pendingPlayFromGestureRef.current = false;
        clearPlayFromGestureRetries();
        onEmbedTransportPaused?.();
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
        if (!isPlaybackVideoUiLoadingRef.current) {
          completeEmbedPlaybackHandshake();
        } else {
          tryConfirmAudibleEmbedPlayback({
            playerState: YOUTUBE_PLAYER_STATE_PLAYING,
          });
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
      completeEmbedPlaybackHandshake,
      onEmbedTransportPaused,
      isPlaybackVideoUiLoadingRef,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      playbackVideoTransitionTargetIdRef,
      tryConfirmAudibleEmbedPlayback,
    ],
  );

  useEffect(() => {
    if (
      !selectShouldRunVisibleTabAudibleSyncPoll({
        transportSessionActive: isPlaying,
        transportPaused: isPaused,
        videoUiLoading: isPlaybackVideoUiLoading,
        embedConfirmed: embedPlaybackConfirmedRef.current,
        documentHidden,
      })
    ) {
      return;
    }

    const pollAudibleEmbedState = () => {
      if (
        !isPlaybackVideoUiLoadingRef.current ||
        embedPlaybackConfirmedRef.current
      ) {
        return;
      }

      syncEmbedPlaybackState();
    };

    pollAudibleEmbedState();
    const intervalId = window.setInterval(
      pollAudibleEmbedState,
      PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    documentHidden,
    embedPlaybackConfirmedRef,
    isPaused,
    isPlaybackVideoUiLoading,
    isPlaybackVideoUiLoadingRef,
    isPlaying,
    syncEmbedPlaybackState,
  ]);

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
    if (
      !selectShouldRunHiddenTabPlayerStatePoll({
        transportSessionActive: isPlaying,
        documentHidden,
        transportPaused: isPaused,
        withinTrackSwitchGrace: isWithinTrackSwitchGrace(),
      })
    ) {
      return;
    }

    const pollHiddenTabPlayerState = () => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      syncEmbedPlaybackState();

      if (
        selectShouldAttemptPlayFromGestureDuringHiddenPoll({
          transportSessionActive: isPlayingRef.current,
          documentHidden: true,
          transportPaused: isPausedRef.current,
          withinTrackSwitchGrace: isWithinTrackSwitchGrace(),
        })
      ) {
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
    documentHidden,
    isPaused,
    isPausedRef,
    isPlaying,
    isPlayingRef,
    isWithinTrackSwitchGrace,
    syncEmbedPlaybackState,
    isPaused,
    isPlayingRef.current,
  ]);

  const previousActiveVideoIdRef = useRef<string | null>(null);

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

    if (
      shouldHoldConfirmedEmbedDuringSimilarQueueFetch({
        similarQueueFetchInFlight: similarQueueFetchInFlightRef.current,
        embedPlaybackConfirmed: embedPlaybackConfirmedRef.current,
      })
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
    embedPlaybackConfirmedRef,
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
    similarQueueFetchInFlightRef,
  ]);

  useEffect(() => {
    const previousActiveVideoId = previousActiveVideoIdRef.current;
    previousActiveVideoIdRef.current = activeVideoId;

    if (
      !(activeVideoId && isPlaying) ||
      isPaused ||
      pendingTrackPosition ||
      pendingPreviewVideoUri
    ) {
      return;
    }

    if (
      previousActiveVideoId !== null ||
      pendingPlayFromGestureRef.current ||
      matchedActiveVideoId !== null
    ) {
      return;
    }

    pendingPlayFromGestureRef.current = true;
    markEmbedTrackSwitchGrace();
    schedulePlayFromGestureAttempts();
  }, [
    activeVideoId,
    isPaused,
    isPlaying,
    markEmbedTrackSwitchGrace,
    matchedActiveVideoId,
    pendingPlayFromGestureRef,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    schedulePlayFromGestureAttempts,
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

      if (parseYoutubeEmbedReadyFromMessage(event.data)) {
        enableYoutubeIframeListening(iframe);
        onYoutubeEmbedPlayerReady?.();
        return;
      }

      const embedErrorCode = parseYoutubePlayerErrorFromMessage(event.data);

      if (embedErrorCode !== null) {
        if (
          shouldIgnoreYoutubeEmbedErrorDuringTrackSwitchGrace({
            errorCode: embedErrorCode,
            isWithinTrackSwitchGrace: isWithinTrackSwitchGrace(),
            isPlaybackVideoUiLoading: isPlaybackVideoUiLoadingRef.current,
            hasPlaybackVideoTransitionTarget:
              playbackVideoTransitionTargetIdRef.current !== null,
          })
        ) {
          return;
        }

        onYoutubeEmbedPlaybackError?.(embedErrorCode);
        return;
      }

      const infoDelivery = parseYoutubeInfoDelivery(event.data);

      if (infoDelivery) {
        if (isYoutubeEmbedAtOrPastEnd(infoDelivery)) {
          notifyEmbedPlaybackEnded();
          return;
        }

        const previousCurrentTime = lastInfoDeliveryCurrentTimeRef.current;

        if (infoDelivery.currentTime !== undefined) {
          lastInfoDeliveryCurrentTimeRef.current = infoDelivery.currentTime;
        }

        if (
          tryConfirmAudibleEmbedPlayback({
            ...definedProps({
              playerState: infoDelivery.playerState,
              infoDeliveryCurrentTime: infoDelivery.currentTime,
              previousInfoDeliveryCurrentTime: previousCurrentTime,
            }),
          })
        ) {
          return;
        }
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
    isWithinTrackSwitchGrace,
    lastInfoDeliveryCurrentTimeRef,
    notifyEmbedPlaybackEnded,
    onYoutubeEmbedPlaybackError,
    onYoutubeEmbedPlayerReady,
    playbackIframeRef,
    isPlaybackVideoUiLoadingRef,
    playbackVideoTransitionTargetIdRef,
    tryConfirmAudibleEmbedPlayback,
  ]);

  const resumePlaybackFromGesture = useCallback(() => {
    schedulePlayFromGestureAttempts();
  }, [schedulePlayFromGestureAttempts]);

  const clearEmbedLoadStateSyncTimeout = useCallback(() => {
    if (embedLoadStateSyncTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(embedLoadStateSyncTimeoutRef.current);
    embedLoadStateSyncTimeoutRef.current = null;
  }, []);

  const notifyImperativeEmbedLoadStarted = useCallback(() => {
    markEmbedTrackSwitchGrace();
    lastInfoDeliveryCurrentTimeRef.current = undefined;
    onImperativeEmbedLoadStarted?.();
    schedulePlayFromGestureAttempts();
    clearEmbedLoadStateSyncTimeout();
    embedLoadStateSyncTimeoutRef.current = window.setTimeout(() => {
      embedLoadStateSyncTimeoutRef.current = null;
      requestYoutubeEmbedPlaybackSync(playbackIframeRef.current);
    }, EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS);
  }, [
    clearEmbedLoadStateSyncTimeout,
    lastInfoDeliveryCurrentTimeRef,
    markEmbedTrackSwitchGrace,
    onImperativeEmbedLoadStarted,
    playbackIframeRef,
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
        clearEmbedLoadStateSyncTimeout();
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
      clearEmbedLoadStateSyncTimeout,
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
    resolveQueueItemEmbedVideoId,
    prefetchQueueItemEmbed,
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    notifyImperativeEmbedLoadStarted,
    resumePlaybackFromGesture,
    recoverPlaybackAfterTabVisible,
    markEmbedTrackSwitchGrace,
  };
};
