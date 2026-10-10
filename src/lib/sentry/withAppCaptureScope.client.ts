"use client";

import * as Sentry from "@sentry/react";
import type { AppCaptureScopeContext } from "src/lib/sentry/appCaptureScope.types";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export type { AppCaptureScopeContext } from "src/lib/sentry/appCaptureScope.types";

export const withAppCaptureScope = (
  context: AppCaptureScopeContext | undefined,
  capture: () => void,
) => {
  if (!resolveSentryEnabled()) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      scope.setTags(context.tags);
    }

    if (context?.extra) {
      scope.setExtras(context.extra);
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    capture();
  });
};
