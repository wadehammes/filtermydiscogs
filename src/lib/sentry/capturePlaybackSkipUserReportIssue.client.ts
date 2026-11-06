"use client";

import type { PlaybackSkipCapturePayload } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { buildPlaybackSkipUserReportCaptureOptions } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";

export const capturePlaybackSkipUserReportIssue = (
  payload: PlaybackSkipCapturePayload,
  userReport: PlaybackSkipUserReportFormValues,
): void => {
  const options = buildPlaybackSkipUserReportCaptureOptions(
    payload,
    userReport,
  );
  captureAppMessage(options.message, {
    level: options.level,
    fingerprint: options.fingerprint,
    tags: options.tags,
    extra: options.extra,
  });
};
