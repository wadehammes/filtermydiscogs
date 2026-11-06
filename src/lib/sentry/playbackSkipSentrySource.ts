import type { SeverityLevel } from "@sentry/core";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

export const PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE = -2;

export type PlaybackSkipSource = "watchdog" | "youtube" | "public_report";

export const resolvePlaybackSkipSource = (
  errorCode: number,
): PlaybackSkipSource => {
  if (errorCode === PLAYBACK_EMBED_UNAVAILABLE_FALLBACK) {
    return "watchdog";
  }

  if (errorCode === PUBLIC_PLAYBACK_VIDEO_REPORT_ERROR_CODE) {
    return "public_report";
  }

  return "youtube";
};

export const resolvePlaybackSkipSentryLevel = (
  source: PlaybackSkipSource,
): SeverityLevel => (source === "watchdog" ? "warning" : "info");
