import type { SeverityLevel } from "@sentry/core";
import {
  buildPlaybackSkipSentryDetailLine,
  buildPlaybackSkipSentryMessage,
  buildPlaybackSkipSentryTags,
  type PlaybackSkipSentryDetails,
} from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";
import { definedProps } from "src/utils/definedProps";
import { PLAYBACK_EMBED_UNAVAILABLE_FALLBACK } from "src/utils/playbackEmbedUnavailableSkip";

export type PlaybackSkipSource = "watchdog" | "youtube";

export type PlaybackSkipSentryContext = PlaybackSkipSentryDetails;

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

  const eventInput = definedProps({
    source,
    reason,
    trackLabel,
    details: context,
  });

  const message = buildPlaybackSkipSentryMessage(eventInput);
  const detailLine = buildPlaybackSkipSentryDetailLine(eventInput);

  captureAppMessage(message, {
    level,
    fingerprint: [
      "playback-skip",
      source,
      context?.trackKey ?? trackLabel,
      String(errorCode),
    ],
    tags: buildPlaybackSkipSentryTags(
      definedProps({ source, errorCode, details: context }),
    ),
    extra: {
      detailLine,
      trackLabel,
      reason,
      skipSource: source,
      ...context,
    },
  });
};
