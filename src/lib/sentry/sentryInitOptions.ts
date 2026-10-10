import { dsnFromString, type ErrorEvent, type EventHint } from "@sentry/core";
import { isViewTransitionInterruptionError } from "src/utils/viewTransitionInterruptions";

export const SENTRY_TUNNEL_PATH = "/monitoring";

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

const parseSentrySampleRate = (
  sampleRateEnv: string | undefined,
  fallback: number,
): number => {
  if (sampleRateEnv === undefined || sampleRateEnv.trim() === "") {
    return fallback;
  }

  const parsedSampleRate = Number(sampleRateEnv);
  if (
    !Number.isFinite(parsedSampleRate) ||
    parsedSampleRate < 0 ||
    parsedSampleRate > 1
  ) {
    return fallback;
  }

  return parsedSampleRate;
};

export const resolveSentryReplaySessionSampleRate = (): number => {
  if (!resolveSentryEnabled()) {
    return 0;
  }

  const sessionSampleRateEnv =
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE;
  if (sessionSampleRateEnv !== undefined) {
    return parseSentrySampleRate(sessionSampleRateEnv, 0.1);
  }

  if (process.env.NODE_ENV === "development") {
    return 1;
  }

  return 0.1;
};

export const resolveSentryReplayOnErrorSampleRate = (): number => {
  if (!resolveSentryEnabled()) {
    return 0;
  }

  return parseSentrySampleRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    1,
  );
};

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

export const resolveSentryBrowserTunnel = (): string | undefined => {
  const dsn = resolveSentryDsn();
  if (!dsn?.trim()) {
    return undefined;
  }

  const dsnComponents = dsnFromString(dsn);
  if (!dsnComponents) {
    return undefined;
  }

  const sentrySaasDsnMatch = dsnComponents.host.match(
    /^o(\d+)\.ingest(?:\.([a-z]{2}))?\.sentry\.io$/,
  );
  if (!sentrySaasDsnMatch) {
    return undefined;
  }

  const orgId = sentrySaasDsnMatch[1];
  const regionCode = sentrySaasDsnMatch[2];
  let tunnelPath = `${SENTRY_TUNNEL_PATH}?o=${orgId}&p=${dsnComponents.projectId}`;
  if (regionCode) {
    tunnelPath += `&r=${regionCode}`;
  }

  return tunnelPath;
};

export const buildSharedSentryInitOptions = () => ({
  dsn: resolveSentryDsn(),
  enabled: resolveSentryEnabled(),
  environment: resolveSentryEnvironment(),
  release: resolveSentryRelease(),
  sendDefaultPii: false,
  beforeSend: sentryBeforeSend,
});

export const buildBrowserSentryInitOptions = () => {
  const tunnel = resolveSentryBrowserTunnel();

  return {
    ...buildSharedSentryInitOptions(),
    ...(tunnel ? { tunnel } : {}),
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
  };
};
