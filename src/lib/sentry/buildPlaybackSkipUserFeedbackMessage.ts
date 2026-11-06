import type { PlaybackSkipCapturePayload } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { buildPlaybackSkipSentryDetailLine } from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import type { PlaybackSkipSource } from "src/lib/sentry/playbackSkipSentrySource";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";
import { definedProps } from "src/utils/definedProps";
import { PLAYBACK_SKIP_USER_REPORT_CATEGORY_LABELS } from "src/utils/playbackSkipUserReportLabels";

export const buildPlaybackSkipUserFeedbackMessage = (
  { trackLabel, reason, context }: PlaybackSkipCapturePayload,
  userReport: PlaybackSkipUserReportFormValues,
  source: PlaybackSkipSource,
): string => {
  const detailLine = buildPlaybackSkipSentryDetailLine(
    definedProps({
      source,
      reason,
      trackLabel,
      details: context,
    }),
  );

  const lines = [
    PLAYBACK_SKIP_USER_REPORT_CATEGORY_LABELS[userReport.category],
    detailLine,
    `Reason: ${reason}`,
  ];

  const note = userReport.note?.trim();
  if (note) {
    lines.push(`User note: ${note}`);
  }

  return lines.join("\n");
};
