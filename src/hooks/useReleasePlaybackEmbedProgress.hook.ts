"use client";

import { useCallback, useRef, useState } from "react";
import {
  applyPlaybackEmbedProgressGuard,
  clearPlaybackEmbedProgressGuard,
  createPlaybackEmbedProgressGuardForLocalSeek,
  createPlaybackEmbedProgressGuardForTrackReset,
  mergeEmbedProgressFromInfoDelivery,
  PLAYBACK_EMBED_PROGRESS_THROTTLE_MS,
  PLAYBACK_EMBED_PROGRESS_TRACK_RESET,
  type PlaybackEmbedProgress,
  type PlaybackEmbedProgressGuard,
  shouldClearPlaybackEmbedProgressGuard,
  shouldPublishEmbedProgressUpdate,
} from "src/utils/playbackEmbedProgress";
import type { YoutubeInfoDelivery } from "src/utils/youtubeIframeEvents";

export const useReleasePlaybackEmbedProgress = () => {
  const [embedProgress, setEmbedProgress] =
    useState<PlaybackEmbedProgress | null>(null);
  const lastPublishedAtMsRef = useRef<number | null>(null);
  const latestProgressRef = useRef<PlaybackEmbedProgress | null>(null);
  const progressGuardRef = useRef<PlaybackEmbedProgressGuard>(
    clearPlaybackEmbedProgressGuard(),
  );

  const publishProgress = useCallback((progress: PlaybackEmbedProgress) => {
    latestProgressRef.current = progress;
    lastPublishedAtMsRef.current = Date.now();
    setEmbedProgress(progress);
  }, []);

  const handleInfoDelivery = useCallback(
    (info: YoutubeInfoDelivery) => {
      const merged = mergeEmbedProgressFromInfoDelivery({
        previous: latestProgressRef.current,
        info,
      });

      if (!merged) {
        return;
      }

      const nowMs = Date.now();
      const guarded = applyPlaybackEmbedProgressGuard({
        progress: merged,
        guard: progressGuardRef.current,
        nowMs,
      });

      if (!guarded) {
        return;
      }

      latestProgressRef.current = guarded;

      if (
        shouldClearPlaybackEmbedProgressGuard({
          progress: guarded,
          guard: progressGuardRef.current,
          nowMs,
        })
      ) {
        progressGuardRef.current = clearPlaybackEmbedProgressGuard();
      }

      if (
        !shouldPublishEmbedProgressUpdate({
          lastPublishedAtMs: lastPublishedAtMsRef.current,
          nowMs,
          throttleMs: PLAYBACK_EMBED_PROGRESS_THROTTLE_MS,
        })
      ) {
        return;
      }

      publishProgress(guarded);
    },
    [publishProgress],
  );

  const resetEmbedProgress = useCallback(() => {
    const nowMs = Date.now();
    progressGuardRef.current =
      createPlaybackEmbedProgressGuardForTrackReset(nowMs);
    const nextProgress: PlaybackEmbedProgress = {
      currentTime: PLAYBACK_EMBED_PROGRESS_TRACK_RESET.currentTime,
      duration: latestProgressRef.current?.duration ?? null,
    };
    latestProgressRef.current = nextProgress;
    lastPublishedAtMsRef.current = nowMs;
    setEmbedProgress(nextProgress);
  }, []);

  const releaseStaleEmbedProgressGuard = useCallback(() => {
    progressGuardRef.current = clearPlaybackEmbedProgressGuard();
  }, []);

  const applyLocalSeekSeconds = useCallback(
    (seconds: number) => {
      progressGuardRef.current =
        createPlaybackEmbedProgressGuardForLocalSeek(seconds);

      if (!latestProgressRef.current) {
        publishProgress({ currentTime: seconds, duration: null });
        return;
      }

      publishProgress({
        ...latestProgressRef.current,
        currentTime: seconds,
      });
    },
    [publishProgress],
  );

  return {
    embedProgress,
    handleInfoDelivery,
    resetEmbedProgress,
    releaseStaleEmbedProgressGuard,
    applyLocalSeekSeconds,
  };
};
