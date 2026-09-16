"use client";

import type { QueryClient } from "@tanstack/react-query";
import {
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  useCallback,
  useEffect,
} from "react";
import { DiscogsReleaseQueryKeys } from "src/hooks/queries/querykeys.constants";
import { discogsReleaseQueryOptions } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsTrack, DiscogsVideo } from "src/types";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { resolveQueueItemYoutubeVideoId } from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import {
  loadAndPlayYoutubeVideo,
  requestYoutubePlayerState,
} from "src/utils/postYoutubePlayerCommand";
import { isSameReleaseInstance, parseReleaseId } from "src/utils/releaseNotes";
import {
  flattenTracklist,
  PLAY_FROM_GESTURE_RETRY_DELAYS_MS,
  postYoutubePlayerCommand,
} from "src/utils/releasePlayback";
import {
  enableYoutubeIframeListening,
  HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS,
  isYoutubeEmbedOrigin,
  parseYoutubePlayerStateFromMessage,
  YOUTUBE_PLAYER_STATE_CUED,
  YOUTUBE_PLAYER_STATE_ENDED,
  YOUTUBE_PLAYER_STATE_PAUSED,
  YOUTUBE_PLAYER_STATE_PLAYING,
} from "src/utils/youtubeIframeEvents";

export interface ReleasePlaybackYoutubeEmbedRefs {
  playbackIframeRef: MutableRefObject<HTMLIFrameElement | null>;
  embedVideoIdRef: MutableRefObject<string | null>;
  lastSyncedActiveVideoIdRef: MutableRefObject<string | null>;
  isPlayingRef: RefObject<boolean>;
  isPausedRef: RefObject<boolean>;
  pendingPlayFromGestureRef: MutableRefObject<boolean>;
  playFromGestureRetryTimeoutsRef: MutableRefObject<number[]>;
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
  onPlaybackEnded,
}: UseReleasePlaybackYoutubeEmbedParams) => {
  const {
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
  } = refs;

  const clearPlayFromGestureRetries = useCallback(() => {
    for (const timeoutId of playFromGestureRetryTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }

    playFromGestureRetryTimeoutsRef.current = [];
  }, [playFromGestureRetryTimeoutsRef]);

  const attemptPlayFromGesture = useCallback(() => {
    if (!pendingPlayFromGestureRef.current || isPausedRef.current) {
      return;
    }

    postYoutubePlayerCommand({
      iframe: playbackIframeRef.current,
      command: "playVideo",
    });
  }, [isPausedRef, pendingPlayFromGestureRef, playbackIframeRef]);

  const schedulePlayFromGestureAttempts = useCallback(() => {
    clearPlayFromGestureRetries();

    if (!pendingPlayFromGestureRef.current || isPausedRef.current) {
      return;
    }

    attemptPlayFromGesture();

    for (const delay of PLAY_FROM_GESTURE_RETRY_DELAYS_MS) {
      if (delay === 0) {
        continue;
      }

      playFromGestureRetryTimeoutsRef.current.push(
        window.setTimeout(() => {
          attemptPlayFromGesture();
        }, delay),
      );
    }
  }, [
    attemptPlayFromGesture,
    clearPlayFromGestureRetries,
    isPausedRef,
    pendingPlayFromGestureRef,
    playFromGestureRetryTimeoutsRef,
  ]);

  const syncEmbedToVideoId = useCallback(
    (videoId: string) => {
      embedVideoIdRef.current = videoId;
      setEmbedVideoId(videoId);

      if (!isPausedRef.current) {
        pendingPlayFromGestureRef.current = true;
        loadAndPlayYoutubeVideo({
          iframe: playbackIframeRef.current,
          videoId,
        });
        schedulePlayFromGestureAttempts();
      }
    },
    [
      embedVideoIdRef,
      isPausedRef,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      schedulePlayFromGestureAttempts,
      setEmbedVideoId,
    ],
  );

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
        .query(discogsReleaseQueryOptions(String(itemReleaseId)))
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
        onPlaybackEnded();
        return;
      }

      if (document.visibilityState === "hidden") {
        return;
      }

      if (
        playerState === YOUTUBE_PLAYER_STATE_PAUSED &&
        isPlayingRef.current &&
        !isPausedRef.current
      ) {
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
      onPlaybackEnded,
      pendingPlayFromGestureRef,
      playbackIframeRef,
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

      requestYoutubePlayerState(playbackIframeRef.current);

      if (!isPausedRef.current) {
        schedulePlayFromGestureAttempts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    isPausedRef,
    isPlayingRef,
    playbackIframeRef,
    schedulePlayFromGestureAttempts,
  ]);

  useEffect(() => {
    if (!isPlaying || isPaused) {
      return;
    }

    const pollHiddenTabPlayerState = () => {
      if (document.visibilityState !== "hidden") {
        return;
      }

      requestYoutubePlayerState(playbackIframeRef.current);
    };

    const intervalId = window.setInterval(
      pollHiddenTabPlayerState,
      HIDDEN_TAB_YOUTUBE_PLAYER_STATE_POLL_MS,
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, isPlaying, playbackIframeRef]);

  useEffect(() => {
    if (
      !(activeVideoId && isPlaying) ||
      pendingTrackPosition ||
      pendingPreviewVideoUri ||
      releaseId === null ||
      Number(releaseDetailId) !== Number(releaseId)
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
    lastSyncedActiveVideoIdRef,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    releaseDetailId,
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
  }, [
    activeVideoId,
    isPlaybackReady,
    pendingPlayFromGestureRef,
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

      const playerState = parseYoutubePlayerStateFromMessage(event.data);

      if (playerState === null) {
        return;
      }

      handleYoutubeEmbedPlayerState(playerState);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleYoutubeEmbedPlayerState, playbackIframeRef]);

  const resumePlaybackFromGesture = useCallback(() => {
    schedulePlayFromGestureAttempts();
  }, [schedulePlayFromGestureAttempts]);

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

      if (isPlaybackEmbedMounted && !pendingPlayFromGestureRef.current) {
        setShouldAutoplayEmbed(false);
      }

      setIsPlaybackEmbedMounted(true);
      schedulePlayFromGestureAttempts();
    },
    [
      clearPlayFromGestureRetries,
      isPlaybackEmbedMounted,
      pendingPlayFromGestureRef,
      playbackIframeRef,
      schedulePlayFromGestureAttempts,
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
    resumePlaybackFromGesture,
  };
};
