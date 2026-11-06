import {
  buildPlaybackSkipCaptureOptions,
  type PlaybackSkipCapturePayload,
} from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";
import { capturePlaybackSkipUserFeedback } from "src/lib/sentry/capturePlaybackSkipUserFeedback.client";
import { capturePlaybackSkipUserReportIssue } from "src/lib/sentry/capturePlaybackSkipUserReportIssue.client";
import { deliverSentryClientCapture } from "src/lib/sentry/deliverSentryClientCapture.client";
import { resolvePlaybackSkipSource } from "src/lib/sentry/playbackSkipSentrySource";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";

const MAX_PLAYBACK_SKIP_SENTRY_REPORTS = 15;
let playbackSkipSentryReportCount = 0;

export const resetPlaybackSkipSentryReportCountForTests = () => {
  playbackSkipSentryReportCount = 0;
};

export const getPlaybackSkipSentryReportCountForTests = () =>
  playbackSkipSentryReportCount;

const capturePlaybackSkipReport = (payload: PlaybackSkipCapturePayload) => {
  const options = buildPlaybackSkipCaptureOptions(payload);
  captureAppMessage(options.message, {
    level: options.level,
    fingerprint: options.fingerprint,
    tags: options.tags,
    extra: options.extra,
  });
};

export const reportPlaybackSkipToSentry = (
  payload: PlaybackSkipCapturePayload,
) => {
  if (resolvePlaybackSkipSource(payload.errorCode) === "watchdog") {
    return;
  }

  if (playbackSkipSentryReportCount >= MAX_PLAYBACK_SKIP_SENTRY_REPORTS) {
    return;
  }

  playbackSkipSentryReportCount += 1;
  capturePlaybackSkipReport(payload);
};

export const reportUserPlaybackSkipToSentry = (
  payload: PlaybackSkipCapturePayload,
  userReport: PlaybackSkipUserReportFormValues,
): Promise<boolean> =>
  deliverSentryClientCapture(() => {
    capturePlaybackSkipUserFeedback(payload, userReport);
    capturePlaybackSkipUserReportIssue(payload, userReport);
  });
