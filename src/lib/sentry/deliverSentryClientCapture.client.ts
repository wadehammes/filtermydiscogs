"use client";

import { flushSentryClient } from "src/lib/sentry/flushSentryClient.client";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const deliverSentryClientCapture = async (
  capture: () => void,
): Promise<boolean> => {
  if (!resolveSentryEnabled()) {
    return false;
  }

  capture();
  return flushSentryClient();
};
