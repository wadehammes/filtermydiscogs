"use client";

import { type Dispatch, type RefObject, useCallback } from "react";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { postYoutubePlayerCommand } from "src/utils/postYoutubePlayerCommand";

export const useReleasePlaybackTransportToggle = ({
  isPaused,
  dispatchSession,
  playbackIframeRef,
  awaitingResumeGestureRef,
  pendingPlayFromGestureRef,
  schedulePlayFromGestureAttempts,
  clearPlayFromGestureRetries,
}: {
  isPaused: boolean;
  dispatchSession: Dispatch<PlaybackSessionAction>;
  playbackIframeRef: RefObject<HTMLIFrameElement | null>;
  awaitingResumeGestureRef: RefObject<boolean>;
  pendingPlayFromGestureRef: RefObject<boolean>;
  schedulePlayFromGestureAttempts: () => void;
  clearPlayFromGestureRetries: () => void;
}): (() => void) => {
  return useCallback(() => {
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
  }, [
    clearPlayFromGestureRetries,
    dispatchSession,
    isPaused,
    awaitingResumeGestureRef,
    pendingPlayFromGestureRef,
    playbackIframeRef,
    schedulePlayFromGestureAttempts,
  ]);
};
