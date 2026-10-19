import type { RefObject } from "react";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";

export type PlaybackEndedAdvanceRefs = {
  isPlayingRef: RefObject<boolean>;
  isPausedRef: RefObject<boolean>;
  queueRef: RefObject<PlaybackQueueItem[]>;
  extendQueueTailRef: RefObject<() => Promise<boolean>>;
  playNextRef: RefObject<() => void>;
};

export const shouldAdvancePlaybackOnEmbedEnded = ({
  isPlaying,
  isPaused,
  documentVisibilityState,
}: {
  isPlaying: boolean;
  isPaused: boolean;
  documentVisibilityState: DocumentVisibilityState;
}): boolean => {
  if (!isPlaying) {
    return false;
  }

  if (isPaused && documentVisibilityState === "visible") {
    return false;
  }

  return true;
};

export const createPlaybackEndedAdvanceHandler = ({
  isPlayingRef,
  isPausedRef,
  queueRef,
  extendQueueTailRef,
  playNextRef,
}: PlaybackEndedAdvanceRefs): (() => void) => {
  return () => {
    if (
      !shouldAdvancePlaybackOnEmbedEnded({
        isPlaying: isPlayingRef.current,
        isPaused: isPausedRef.current,
        documentVisibilityState:
          typeof document === "undefined"
            ? "visible"
            : document.visibilityState,
      })
    ) {
      return;
    }

    if (queueRef.current.length === 0) {
      void extendQueueTailRef.current().then((extended) => {
        if (extended && isPlayingRef.current && queueRef.current.length > 0) {
          playNextRef.current();
        }
      });
      return;
    }

    playNextRef.current();
  };
};
