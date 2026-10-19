import {
  PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_LOADING_REARMS,
  shouldRearmEmbedStartWatchdogBeforeUnavailableSkip,
} from "src/utils/playbackEmbedStartWatchdog";

export type EmbedUnavailableWatchdogOutcome = "defer" | "rearm" | "skip";

export const resolveEmbedUnavailableWatchdogOutcome = ({
  embedPlaybackConfirmed,
  watchdogVideoId,
  embedVideoId,
  isPlaybackVideoUiLoading,
  rearmCount,
  youtubePlayerReadyVideoId = null,
}: {
  embedPlaybackConfirmed: boolean;
  watchdogVideoId: string | null;
  embedVideoId: string | null;
  isPlaybackVideoUiLoading: boolean;
  rearmCount: number;
  youtubePlayerReadyVideoId?: string | null;
}): EmbedUnavailableWatchdogOutcome => {
  if (embedPlaybackConfirmed) {
    return "defer";
  }

  if (
    watchdogVideoId !== null &&
    embedVideoId !== null &&
    watchdogVideoId !== embedVideoId
  ) {
    return "defer";
  }

  if (
    shouldRearmEmbedStartWatchdogBeforeUnavailableSkip({
      isPlaybackVideoUiLoading,
      watchdogVideoId,
      embedVideoId,
      rearmCount,
    })
  ) {
    return "rearm";
  }

  if (
    watchdogVideoId !== null &&
    youtubePlayerReadyVideoId !== null &&
    watchdogVideoId === youtubePlayerReadyVideoId &&
    rearmCount < PLAYBACK_EMBED_UNAVAILABLE_WATCHDOG_LOADING_REARMS + 1
  ) {
    return "rearm";
  }

  return "skip";
};
