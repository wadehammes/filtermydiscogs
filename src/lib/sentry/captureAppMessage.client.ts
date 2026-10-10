"use client";

import type { SeverityLevel } from "@sentry/core";
import * as Sentry from "@sentry/react";
import { withAppCaptureScope } from "src/lib/sentry/withAppCaptureScope.client";

export const captureAppMessage = (
  message: string,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: SeverityLevel;
    fingerprint?: string[];
  },
) => {
  withAppCaptureScope(context, () => {
    Sentry.captureMessage(message, context?.level ?? "info");
  });
};
