"use client";

import * as Sentry from "@sentry/react";
import type { AppCaptureScopeContext } from "src/lib/sentry/appCaptureScope.types";
import { normalizeSentryError } from "src/lib/sentry/normalizeSentryError";
import { withAppCaptureScope } from "src/lib/sentry/withAppCaptureScope.client";

export const captureAppError = (
  error: unknown,
  context?: AppCaptureScopeContext,
) => {
  withAppCaptureScope(context, () => {
    Sentry.captureException(normalizeSentryError(error));
  });
};
