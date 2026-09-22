import type { RefObject } from "react";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";

export type PlaybackEndedAdvanceRefs = {
  isPlayingRef: RefObject<boolean>;
  queueRef: RefObject<PlaybackQueueItem[]>;
  extendQueueTailRef: RefObject<() => Promise<boolean>>;
  playNextRef: RefObject<() => void>;
};

export const createPlaybackEndedAdvanceHandler = ({
  isPlayingRef,
  queueRef,
  extendQueueTailRef,
  playNextRef,
}: PlaybackEndedAdvanceRefs): (() => void) => {
  return () => {
    if (!isPlayingRef.current) {
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
