"use client";

import { feedbackIntegration } from "@sentry/react";
import { SENTRY_USER_FEEDBACK_SOURCE_TAG } from "src/constants/sentryUserFeedbackForm.constants";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const buildSentryFeedbackClientOptions = ():
  | {
      integrations: ReturnType<typeof feedbackIntegration>[];
    }
  | Record<string, never> => {
  if (!resolveSentryEnabled()) {
    return {};
  }

  return {
    integrations: [
      feedbackIntegration({
        autoInject: false,
        enableScreenshot: true,
        tags: {
          feedback_source: SENTRY_USER_FEEDBACK_SOURCE_TAG,
        },
      }),
    ],
  };
};
