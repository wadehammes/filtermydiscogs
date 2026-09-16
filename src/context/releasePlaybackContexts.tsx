"use client";

import { createContext } from "react";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackState,
} from "src/types/releasePlaybackContext.types";

export const ReleasePlaybackStateContext = createContext<
  ReleasePlaybackState | undefined
>(undefined);

export const ReleasePlaybackActionsContext = createContext<
  ReleasePlaybackActions | undefined
>(undefined);

export const ReleasePlaybackQueueContext = createContext<
  PlaybackQueueItem[] | undefined
>(undefined);

export const ReleasePlaybackVisibilityContext = createContext(false);
