"use client";

import { useContext, useMemo } from "react";
import {
  ReleasePlaybackActionsContext,
  ReleasePlaybackQueueContext,
  ReleasePlaybackStateContext,
  ReleasePlaybackVisibilityContext,
} from "src/context/releasePlaybackContexts";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackContextValue,
  ReleasePlaybackState,
} from "src/types/releasePlaybackContext.types";

export { ReleasePlaybackProvider } from "./ReleasePlaybackProvider.component";

export const useReleasePlaybackState = (): ReleasePlaybackState => {
  const context = useContext(ReleasePlaybackStateContext);

  if (!context) {
    throw new Error(
      "useReleasePlaybackState must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};

export const useReleasePlaybackActions = (): ReleasePlaybackActions => {
  const context = useContext(ReleasePlaybackActionsContext);

  if (!context) {
    throw new Error(
      "useReleasePlaybackActions must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};

export const useIsMiniPlayerVisible = (): boolean => {
  const context = useContext(ReleasePlaybackVisibilityContext);

  if (context === undefined) {
    throw new Error(
      "useIsMiniPlayerVisible must be used within ReleasePlaybackProvider",
    );
  }

  return context;
};

export const useReleasePlaybackQueue = (): {
  queue: PlaybackQueueItem[];
  playQueueAtIndex: ReleasePlaybackActions["playQueueAtIndex"];
  removeFromQueue: ReleasePlaybackActions["removeFromQueue"];
  reorderQueue: ReleasePlaybackActions["reorderQueue"];
  clearQueue: ReleasePlaybackActions["clearQueue"];
} => {
  const queue = useContext(ReleasePlaybackQueueContext);

  if (!queue) {
    throw new Error(
      "useReleasePlaybackQueue must be used within ReleasePlaybackProvider",
    );
  }

  const { playQueueAtIndex, removeFromQueue, reorderQueue, clearQueue } =
    useReleasePlaybackActions();

  return {
    queue,
    playQueueAtIndex,
    removeFromQueue,
    reorderQueue,
    clearQueue,
  };
};

export const useReleasePlaybackIframeActions = (): Pick<
  ReleasePlaybackActions,
  | "registerPlaybackIframe"
  | "notifyPlaybackIframeLoaded"
  | "notifyPlaybackVideoLoadStarted"
  | "notifyPlaybackVideoPresentationReady"
  | "resumePlaybackFromGesture"
> => {
  const {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    notifyPlaybackVideoLoadStarted,
    notifyPlaybackVideoPresentationReady,
    resumePlaybackFromGesture,
  } = useReleasePlaybackActions();

  return {
    registerPlaybackIframe,
    notifyPlaybackIframeLoaded,
    notifyPlaybackVideoLoadStarted,
    notifyPlaybackVideoPresentationReady,
    resumePlaybackFromGesture,
  };
};

export const useReleasePlayback = (): ReleasePlaybackContextValue => {
  const state = useReleasePlaybackState();
  const actions = useReleasePlaybackActions();

  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
};

export const useHasReleasePlaybackProvider = (): boolean =>
  useContext(ReleasePlaybackStateContext) !== undefined;
