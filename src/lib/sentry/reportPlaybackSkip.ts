import {
  buildPlaybackSkipCaptureOptions,
  type PlaybackSkipCapturePayload,
} from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { captureAppMessage } from "src/lib/sentry/captureAppMessage.client";

const MAX_PLAYBACK_SKIP_SENTRY_REPORTS = 15;
let playbackSkipSentryReportCount = 0;

export const resetPlaybackSkipSentryReportCountForTests = () => {
  playbackSkipSentryReportCount = 0;
};

export const getPlaybackSkipSentryReportCountForTests = () =>
  playbackSkipSentryReportCount;

const capturePlaybackSkipReport = (
  payload: PlaybackSkipCapturePayload,
  { userReported }: { userReported: boolean },
) => {
  const options = buildPlaybackSkipCaptureOptions(payload, { userReported });
  captureAppMessage(options.message, {
    level: options.level,
    fingerprint: options.fingerprint,
    tags: options.tags,
    extra: options.extra,
  });
};

export const reportPlaybackSkipToSentry = (
  payload: PlaybackSkipCapturePayload,
  options?: { userReport?: boolean },
) => {
  const userReported = options?.userReport === true;

  if (!userReported) {
    if (playbackSkipSentryReportCount >= MAX_PLAYBACK_SKIP_SENTRY_REPORTS) {
      return;
    }

    playbackSkipSentryReportCount += 1;
  }

  capturePlaybackSkipReport(payload, { userReported });
};

export const reportUserPlaybackSkipToSentry = (
  payload: PlaybackSkipCapturePayload,
) => {
  reportPlaybackSkipToSentry(payload, { userReport: true });
};
