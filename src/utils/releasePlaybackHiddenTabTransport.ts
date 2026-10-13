import {
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED,
  YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT,
  YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE,
} from "src/utils/playbackSkippedTrackLog";

export const isTerminalYoutubeEmbedSkipErrorCode = (
  errorCode: number,
): boolean =>
  errorCode === 0 ||
  errorCode === YOUTUBE_EMBED_ERROR_VIDEO_UNAVAILABLE ||
  errorCode === YOUTUBE_EMBED_ERROR_EMBED_DISABLED ||
  errorCode === YOUTUBE_EMBED_ERROR_EMBED_DISABLED_ALT;

export const shouldIgnoreYoutubeEmbedErrorDuringTrackSwitchGrace = ({
  errorCode,
  isWithinTrackSwitchGrace,
  isPlaybackVideoUiLoading,
  hasPlaybackVideoTransitionTarget,
}: {
  errorCode: number;
  isWithinTrackSwitchGrace: boolean;
  isPlaybackVideoUiLoading: boolean;
  hasPlaybackVideoTransitionTarget: boolean;
}): boolean => {
  if (!isWithinTrackSwitchGrace) {
    return false;
  }

  if (isTerminalYoutubeEmbedSkipErrorCode(errorCode)) {
    return false;
  }

  return isPlaybackVideoUiLoading || hasPlaybackVideoTransitionTarget;
};

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
