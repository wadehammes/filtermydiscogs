"use client";

import { openSentryUserFeedbackDialog } from "src/utils/sentryUserFeedbackDialogBridge";

export const openSentryUserFeedback = (): void => {
  openSentryUserFeedbackDialog();
};
