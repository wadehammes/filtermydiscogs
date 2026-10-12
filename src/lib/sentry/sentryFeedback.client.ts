"use client";

import { feedbackIntegration } from "@sentry/react";
import { SUBMIT_BUG_REPORT_NAV_LABEL } from "src/constants/sentryUserFeedback.constants";
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
        colorScheme: "system",
        formTitle: SUBMIT_BUG_REPORT_NAV_LABEL,
        submitButtonLabel: "Send bug report",
        tags: {
          feedback_source: "user_menu",
        },
      }),
    ],
  };
};
