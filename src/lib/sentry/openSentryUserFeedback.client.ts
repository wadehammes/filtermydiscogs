"use client";

import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";

export const openSentryUserFeedback = (): void => {
  if (!resolveSentryEnabled()) {
    return;
  }

  openSentryUserFeedbackDialog();
};
