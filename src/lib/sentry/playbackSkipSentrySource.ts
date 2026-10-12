import type { SeverityLevel } from "@sentry/core";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

export type PlaybackSkipSource = "watchdog" | "youtube";

export const resolvePlaybackSkipSource = (
  errorCode: number,
): PlaybackSkipSource =>
  errorCode === PLAYBACK_EMBED_UNAVAILABLE_FALLBACK ? "watchdog" : "youtube";

export const resolvePlaybackSkipSentryLevel = (
  source: PlaybackSkipSource,
): SeverityLevel => (source === "watchdog" ? "warning" : "info");
