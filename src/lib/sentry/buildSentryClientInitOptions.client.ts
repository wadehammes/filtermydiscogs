"use client";

import { buildSentryFeedbackClientOptions } from "src/lib/sentry/sentryFeedback.client";
import { buildBrowserSentryInitOptions } from "src/lib/sentry/sentryInitOptions";
import { buildSentryReplayClientOptions } from "src/lib/sentry/sentryReplay.client";

export const buildSentryClientInitOptions = () => {
  const browserOptions = buildBrowserSentryInitOptions();
  const replayOptions = buildSentryReplayClientOptions();
  const feedbackOptions = buildSentryFeedbackClientOptions();

  const integrations = [
    ...(replayOptions.integrations ?? []),
    ...(feedbackOptions.integrations ?? []),
  ];

  return {
    ...browserOptions,
    ...replayOptions,
    ...feedbackOptions,
    ...(integrations.length > 0 ? { integrations } : {}),
  };
};
