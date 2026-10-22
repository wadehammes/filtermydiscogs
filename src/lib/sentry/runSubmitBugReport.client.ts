import { openSentryUserFeedback } from "src/lib/sentry/openSentryUserFeedback.client";

export const runSubmitBugReport = (onSubmitBugReport?: () => void): void => {
  if (onSubmitBugReport !== undefined) {
    onSubmitBugReport();
    return;
  }

  void openSentryUserFeedback();
};
