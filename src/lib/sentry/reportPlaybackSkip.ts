import type { SeverityLevel } from "@sentry/core";
import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

export type PlaybackSkipSource = "watchdog" | "youtube";

export type PlaybackSkipSentryContext = {
  videoId?: string | null;
  watchdogMs?: number;
  connectionQuality?: string;
};

export const resolvePlaybackSkipSource = (
  errorCode: number,
): PlaybackSkipSource =>
  errorCode === PLAYBACK_EMBED_UNAVAILABLE_FALLBACK ? "watchdog" : "youtube";

export const resolvePlaybackSkipSentryLevel = (
  source: PlaybackSkipSource,
): SeverityLevel => (source === "watchdog" ? "warning" : "info");

const MAX_PLAYBACK_SKIP_SENTRY_REPORTS = 15;
let playbackSkipSentryReportCount = 0;

export const resetPlaybackSkipSentryReportCountForTests = () => {
  playbackSkipSentryReportCount = 0;
};

export const getPlaybackSkipSentryReportCountForTests = () =>
  playbackSkipSentryReportCount;

export const reportPlaybackSkipToSentry = ({
  errorCode,
  trackLabel,
  reason,
  context,
}: {
  errorCode: number;
  trackLabel: string;
  reason: string;
  context?: PlaybackSkipSentryContext;
}) => {
  if (playbackSkipSentryReportCount >= MAX_PLAYBACK_SKIP_SENTRY_REPORTS) {
    return;
  }

  playbackSkipSentryReportCount += 1;

  const source = resolvePlaybackSkipSource(errorCode);
  const level = resolvePlaybackSkipSentryLevel(source);

  captureAppMessage(`Playback skip: ${reason}`, {
    level,
    fingerprint: ["playback-skip", source, String(errorCode)],
    tags: {
      "playback.skip_source": source,
      "playback.youtube_error_code": String(errorCode),
    },
    extra: {
      trackLabel,
      reason,
      ...context,
    },
  });
};
