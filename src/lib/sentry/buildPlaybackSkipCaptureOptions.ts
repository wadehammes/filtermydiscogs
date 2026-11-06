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
import { sentryUserVisibleTag } from "src/lib/sentry/sentryUserVisibleTag";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";
import { definedProps } from "src/utils/definedProps";

export type PlaybackSkipCapturePayload = {
  errorCode: number;
  trackLabel: string;
  reason: string;
  context?: PlaybackSkipSentryDetails;
};

export const buildPlaybackSkipCaptureOptions = ({
  errorCode,
  trackLabel,
  reason,
  context,
}: PlaybackSkipCapturePayload): {
  extra: Record<string, unknown>;
  fingerprint: string[];
  level: SeverityLevel;
  message: string;
  tags: Record<string, string>;
} => {
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
  const fingerprint = ["playback-skip", source, reason];

  const tags = {
    ...buildPlaybackSkipSentryTags(
      definedProps({ source, errorCode, details: context }),
    ),
    ...sentryUserVisibleTag(true),
  };

  return {
    level,
    message,
    fingerprint,
    tags,
    extra: definedProps({
      detailLine,
      trackLabel,
      reason,
      skipSource: source,
      userReported: false,
      ...context,
    }),
  };
};

export const buildPlaybackSkipUserReportCaptureOptions = (
  payload: PlaybackSkipCapturePayload,
  userReport: PlaybackSkipUserReportFormValues,
): {
  extra: Record<string, unknown>;
  fingerprint: string[];
  level: SeverityLevel;
  message: string;
  tags: Record<string, string>;
} => {
  const base = buildPlaybackSkipCaptureOptions(payload);

  return {
    level: "warning",
    message: `${base.message} (user report)`,
    fingerprint: base.fingerprint,
    tags: {
      ...base.tags,
      "playback.user_report": "true",
      "playback.user_report_category": userReport.category,
    },
    extra: definedProps({
      ...base.extra,
      userReported: true,
      userReportCategory: userReport.category,
      userNote: userReport.note?.trim(),
    }),
  };
};
