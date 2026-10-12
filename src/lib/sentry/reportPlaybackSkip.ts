import {
  type BuildPlaybackSkipCaptureOptionsParams,
  buildPlaybackSkipCaptureOptions,
  type PlaybackSkipCapturePayload,
} from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";

const MAX_PLAYBACK_SKIP_SENTRY_REPORTS = 15;
let playbackSkipSentryReportCount = 0;

export const resetPlaybackSkipSentryReportCountForTests = () => {
  playbackSkipSentryReportCount = 0;
};

export const getPlaybackSkipSentryReportCountForTests = () =>
  playbackSkipSentryReportCount;

const capturePlaybackSkipReport = (
  payload: PlaybackSkipCapturePayload,
  captureParams: BuildPlaybackSkipCaptureOptionsParams,
) => {
  const options = buildPlaybackSkipCaptureOptions(payload, captureParams);
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
  if (playbackSkipSentryReportCount >= MAX_PLAYBACK_SKIP_SENTRY_REPORTS) {
    return;
  }

  playbackSkipSentryReportCount += 1;
  capturePlaybackSkipReport(payload, { userReported: false });
};

export const reportUserPlaybackSkipToSentry = (
  payload: PlaybackSkipCapturePayload,
  userReport: PlaybackSkipUserReportFormValues,
) => {
  capturePlaybackSkipReport(payload, {
    userReported: true,
    userReport,
  });
};
