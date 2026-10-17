export {
  EMBED_PLAYBACK_CONFIRM_PLAYING_MIN_MS,
  EMBED_WATCHDOG_SYNC_PROBE_RECHECK_MS,
  PLAYBACK_EMBED_AUDIBLE_SYNC_POLL_MS,
  PLAYBACK_EMBED_INITIAL_PRESENTATION_WATCHDOG_GRACE_MS,
  resolveEmbedPlaybackConfirmGateStartedAtMs,
  resolvePlaybackEmbedWatchdogDelayMsWithInitialGrace,
  shouldAcceptEmbedPlayingConfirmation,
  shouldConfirmEmbedPlaybackFromAudibleEmbed,
  shouldConfirmEmbedPlaybackFromWatchdogProgress,
  tryConfirmPlaybackEmbedFromSignal,
} from "src/utils/playbackEmbedSession";

export type {
  PlaybackEmbedConfirmSignal,
  TryConfirmPlaybackEmbedFromSignalInput,
} from "src/utils/playbackEmbedSession";

export const resolveEmbedPlaybackIntentActive = ({
  isPlaying,
  isPlayingRefValue,
  isPaused,
  pendingPlayFromGesture,
  awaitingResumeGesture,
}: {
  isPlaying: boolean;
  isPlayingRefValue: boolean;
  isPaused: boolean;
  pendingPlayFromGesture: boolean;
  awaitingResumeGesture: boolean;
}): boolean => {
  if (isPaused || awaitingResumeGesture) {
    return false;
  }

  return isPlaying || isPlayingRefValue || pendingPlayFromGesture;
};
