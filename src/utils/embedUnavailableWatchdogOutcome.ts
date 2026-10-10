import { shouldRearmEmbedStartWatchdogBeforeUnavailableSkip } from "src/utils/playbackEmbedStartWatchdog";

export type EmbedUnavailableWatchdogOutcome = "defer" | "rearm" | "skip";

export const resolveEmbedUnavailableWatchdogOutcome = ({
  embedPlaybackConfirmed,
  watchdogVideoId,
  embedVideoId,
  isPlaybackVideoUiLoading,
  rearmCount,
}: {
  embedPlaybackConfirmed: boolean;
  watchdogVideoId: string | null;
  embedVideoId: string | null;
  isPlaybackVideoUiLoading: boolean;
  rearmCount: number;
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

  return "skip";
};
