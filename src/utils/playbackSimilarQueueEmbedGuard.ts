export const shouldHoldConfirmedEmbedDuringSimilarQueueFetch = ({
  similarQueueFetchInFlight,
  embedPlaybackConfirmed,
}: {
  similarQueueFetchInFlight: boolean;
  embedPlaybackConfirmed: boolean;
}): boolean => similarQueueFetchInFlight && embedPlaybackConfirmed;

export const shouldSuppressEmbedLoadStartedDuringSimilarQueueFetch = ({
  similarQueueFetchInFlight,
  embedPlaybackConfirmed,
  resolvedVideoId,
  watchdogVideoId,
}: {
  similarQueueFetchInFlight: boolean;
  embedPlaybackConfirmed: boolean;
  resolvedVideoId: string | null;
  watchdogVideoId: string | null;
}): boolean => {
  if (
    !shouldHoldConfirmedEmbedDuringSimilarQueueFetch({
      similarQueueFetchInFlight,
      embedPlaybackConfirmed,
    })
  ) {
    return false;
  }

  if (resolvedVideoId === null || watchdogVideoId === null) {
    return false;
  }

  return resolvedVideoId !== watchdogVideoId;
};

export const shouldRearmEmbedWatchdogAfterSimilarQueueFetchEnd = ({
  embedPlaybackConfirmed,
  isPaused,
  isPlaying,
  isPlaybackVideoUiLoading,
  videoId,
}: {
  embedPlaybackConfirmed: boolean;
  isPaused: boolean;
  isPlaying: boolean;
  isPlaybackVideoUiLoading: boolean;
  videoId: string | null;
}): boolean => {
  if (
    embedPlaybackConfirmed ||
    isPaused ||
    !isPlaying ||
    isPlaybackVideoUiLoading
  ) {
    return false;
  }

  return Boolean(videoId?.trim());
};

export const shouldIgnoreConfirmedEmbedLoadStarted = ({
  embedPlaybackConfirmed,
  resolvedVideoId,
  watchdogVideoId,
  committedEmbedVideoId = null,
}: {
  embedPlaybackConfirmed: boolean;
  resolvedVideoId: string | null;
  watchdogVideoId: string | null;
  committedEmbedVideoId?: string | null;
}): boolean => {
  if (!embedPlaybackConfirmed || resolvedVideoId === null) {
    return false;
  }

  const trimmedResolved = resolvedVideoId.trim();

  if (watchdogVideoId !== null && trimmedResolved === watchdogVideoId.trim()) {
    return true;
  }

  const trimmedCommitted = committedEmbedVideoId?.trim();

  return trimmedCommitted !== undefined && trimmedResolved === trimmedCommitted;
};
