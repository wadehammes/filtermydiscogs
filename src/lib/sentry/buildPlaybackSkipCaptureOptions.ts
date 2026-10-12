import type { SeverityLevel } from "@sentry/core";
import {
  buildPlaybackSkipSentryDetailLine,
  buildPlaybackSkipSentryMessage,
  buildPlaybackSkipSentryTags,
  type PlaybackSkipSentryDetails,
} from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import {
  resolvePlaybackSkipSentryLevel,
  resolvePlaybackSkipSource,
} from "src/lib/sentry/playbackSkipSentrySource";
import { definedProps } from "src/utils/definedProps";

export type PlaybackSkipCapturePayload = {
  errorCode: number;
  trackLabel: string;
  reason: string;
  context?: PlaybackSkipSentryDetails;
};

export const buildPlaybackSkipCaptureOptions = (
  { errorCode, trackLabel, reason, context }: PlaybackSkipCapturePayload,
  { userReported }: { userReported: boolean },
): {
  extra: Record<string, unknown>;
  fingerprint: string[];
  level: SeverityLevel;
  message: string;
  tags: Record<string, string>;
} => {
  const source = resolvePlaybackSkipSource(errorCode);
  const level = userReported
    ? "warning"
    : resolvePlaybackSkipSentryLevel(source);

  const eventInput = definedProps({
    source,
    reason,
    trackLabel,
    details: context,
  });

  let message = buildPlaybackSkipSentryMessage(eventInput);
  if (userReported) {
    message = `${message} (user report)`;
  }

  const detailLine = buildPlaybackSkipSentryDetailLine(eventInput);
  const fingerprint = userReported
    ? [
        "playback-skip",
        "user-report",
        source,
        reason,
        context?.trackKey?.trim() || trackLabel,
      ]
    : ["playback-skip", source, reason];

  const tags = buildPlaybackSkipSentryTags(
    definedProps({ source, errorCode, details: context }),
  );
  if (userReported) {
    tags["playback.user_report"] = "true";
  }

  return {
    level,
    message,
    fingerprint,
    tags,
    extra: {
      detailLine,
      trackLabel,
      reason,
      skipSource: source,
      userReported,
      ...context,
    },
  };
};
