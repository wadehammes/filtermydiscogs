"use client";

import { SENTRY_PLAYBACK_SKIP_FEEDBACK_SOURCE_TAG } from "src/constants/sentryUserFeedbackForm.constants";
import type { PlaybackSkipCapturePayload } from "src/lib/sentry/buildPlaybackSkipCaptureOptions";
import { buildPlaybackSkipSentryTags } from "src/lib/sentry/buildPlaybackSkipSentryEvent";
import { buildPlaybackSkipUserFeedbackMessage } from "src/lib/sentry/buildPlaybackSkipUserFeedbackMessage";
import { captureSentryUserFeedbackWithReplay } from "src/lib/sentry/captureSentryUserFeedbackWithReplay.client";
import { resolvePlaybackSkipSource } from "src/lib/sentry/playbackSkipSentrySource";
import { sentryUserVisibleTag } from "src/lib/sentry/sentryUserVisibleTag";
import type { PlaybackSkipUserReportFormValues } from "src/lib/validation/playbackSkipUserReport.schemas";
import { definedProps } from "src/utils/definedProps";

export const capturePlaybackSkipUserFeedback = (
  payload: PlaybackSkipCapturePayload,
  userReport: PlaybackSkipUserReportFormValues,
): void => {
  const source = resolvePlaybackSkipSource(payload.errorCode);
  const skipTags = buildPlaybackSkipSentryTags(
    definedProps({
      source,
      errorCode: payload.errorCode,
      details: payload.context,
    }),
  );

  captureSentryUserFeedbackWithReplay({
    message: buildPlaybackSkipUserFeedbackMessage(payload, userReport, source),
    source: SENTRY_PLAYBACK_SKIP_FEEDBACK_SOURCE_TAG,
    ...definedProps({ url: window.location.href }),
    tags: {
      ...skipTags,
      ...sentryUserVisibleTag(true),
      "playback.user_report": "true",
      "playback.user_report_category": userReport.category,
      feedback_source: SENTRY_PLAYBACK_SKIP_FEEDBACK_SOURCE_TAG,
    },
  });
};
