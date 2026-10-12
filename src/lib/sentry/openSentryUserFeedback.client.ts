"use client";

import { getFeedback } from "@sentry/react";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const openSentryUserFeedback = async (): Promise<void> => {
  if (!resolveSentryEnabled()) {
    return;
  }

  const feedback = getFeedback();
  if (!feedback) {
    return;
  }

  const form = await feedback.createForm();
  form.appendToDom();
  form.open();
};
