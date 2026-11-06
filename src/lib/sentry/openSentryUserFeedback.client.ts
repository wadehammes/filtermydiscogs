"use client";

import { SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE } from "src/constants/sentryUserFeedbackForm.constants";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";
import { toast } from "src/utils/toast";

export const openSentryUserFeedback = (): void => {
  if (!resolveSentryEnabled()) {
    toast.error(SENTRY_CLIENT_DELIVERY_FAILED_TOAST_MESSAGE);
    return;
  }

  openSentryUserFeedbackDialog();
};
