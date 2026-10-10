import "server-only";

import type { SeverityLevel } from "@sentry/nextjs";
import * as Sentry from "@sentry/nextjs";
import { normalizeSentryError } from "src/lib/sentry/normalizeSentryError";
import { withAppCaptureScope } from "src/lib/sentry/withAppCaptureScope.server";

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
