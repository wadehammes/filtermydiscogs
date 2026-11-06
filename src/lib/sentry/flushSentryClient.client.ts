"use client";

import * as Sentry from "@sentry/react";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const SENTRY_CLIENT_FLUSH_MS = 2000;

export const flushSentryClient = async (
  timeoutMs = SENTRY_CLIENT_FLUSH_MS,
): Promise<boolean> => {
  if (!resolveSentryEnabled()) {
    return false;
  }

  if (!Sentry.getClient()) {
    return false;
  }

  return Sentry.flush(timeoutMs);
};
