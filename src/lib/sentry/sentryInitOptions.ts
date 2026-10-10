import type { ErrorEvent, EventHint } from "@sentry/core";
import { isViewTransitionInterruptionError } from "src/utils/viewTransitionInterruptions";

export const resolveSentryDsn = (): string | undefined =>
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

export const resolveSentryEnabled = (): boolean => {
  if (!resolveSentryDsn()?.trim()) {
    return false;
  }

  if (process.env.NODE_ENV === "test") {
    return false;
  }

  if (process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED === "1") {
    return false;
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.SENTRY_ENABLE_DEV !== "1"
  ) {
    return false;
  }

  return true;
};

export const resolveSentryEnvironment = (): string =>
  process.env.SENTRY_ENVIRONMENT ??
  process.env.NEXT_PUBLIC_VERCEL_ENV ??
  process.env.VERCEL_ENV ??
  process.env.NODE_ENV ??
  "development";

export const resolveSentryRelease = (): string | undefined => {
  const release =
    process.env.SENTRY_RELEASE ??
    process.env.NEXT_PUBLIC_APP_BUILD_VERSION ??
    process.env.VERCEL_GIT_COMMIT_SHA;

  return release?.trim() ? release : undefined;
};

export const sentryBeforeSend = (
  event: ErrorEvent,
  hint: EventHint,
): ErrorEvent | null => {
  if (isViewTransitionInterruptionError(hint.originalException)) {
    return null;
  }

  return event;
};

export const buildSharedSentryInitOptions = () => ({
  dsn: resolveSentryDsn(),
  enabled: resolveSentryEnabled(),
  environment: resolveSentryEnvironment(),
  release: resolveSentryRelease(),
  sendDefaultPii: false,
  beforeSend: sentryBeforeSend,
});
