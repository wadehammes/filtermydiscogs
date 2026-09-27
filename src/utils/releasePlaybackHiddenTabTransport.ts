export const shouldIgnoreYoutubeEmbedPausedWhileDocumentHidden = ({
  visibilityState,
  isWithinTrackSwitchGrace,
  isPlaybackVideoUiLoading,
  hasPlaybackVideoTransitionTarget,
}: {
  visibilityState: DocumentVisibilityState;
  isWithinTrackSwitchGrace: boolean;
  isPlaybackVideoUiLoading: boolean;
  hasPlaybackVideoTransitionTarget: boolean;
}): boolean => {
  if (visibilityState !== "hidden") {
    return false;
  }

  return (
    isWithinTrackSwitchGrace ||
    isPlaybackVideoUiLoading ||
    hasPlaybackVideoTransitionTarget
  );
};

export const shouldDeferEmbedStartWatchdogUntilAfterTabVisibleRecovery = ({
  visibilityState,
  isPlaying,
  isPaused,
  embedPlaybackConfirmed,
}: {
  visibilityState: DocumentVisibilityState;
  isPlaying: boolean;
  isPaused: boolean;
  embedPlaybackConfirmed: boolean;
}): boolean =>
  visibilityState === "visible" &&
  isPlaying &&
  !isPaused &&
  !embedPlaybackConfirmed;
