"use client";

import type { SeverityLevel } from "@sentry/core";
import * as Sentry from "@sentry/react";
import { normalizeSentryError } from "src/lib/sentry/normalizeSentryError";
import { withAppCaptureScope } from "src/lib/sentry/withAppCaptureScope.client";

export const captureAppError = (
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: SeverityLevel;
  },
) => {
  withAppCaptureScope(context, () => {
    Sentry.captureException(normalizeSentryError(error));
  });
};
