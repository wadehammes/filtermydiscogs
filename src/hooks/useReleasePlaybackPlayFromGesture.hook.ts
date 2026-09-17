"use client";

import { type MutableRefObject, type RefObject, useCallback } from "react";
import { postYoutubePlayerCommand } from "src/utils/postYoutubePlayerCommand";
import { PLAY_FROM_GESTURE_RETRY_DELAYS_MS } from "src/utils/releasePlayback";

interface UseReleasePlaybackPlayFromGestureParams {
  isPausedRef: RefObject<boolean>;
  pendingPlayFromGestureRef: MutableRefObject<boolean>;
  playbackIframeRef: MutableRefObject<HTMLIFrameElement | null>;
  playFromGestureRetryTimeoutsRef: MutableRefObject<number[]>;
}

export const useReleasePlaybackPlayFromGesture = ({
  isPausedRef,
  pendingPlayFromGestureRef,
  playbackIframeRef,
  playFromGestureRetryTimeoutsRef,
}: UseReleasePlaybackPlayFromGestureParams) => {
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

  return {
    attemptPlayFromGesture,
    clearPlayFromGestureRetries,
    schedulePlayFromGestureAttempts,
  };
};
