import type { InfrastructureFailureArea } from "src/lib/sentry/reportInfrastructureFailure";
import { resolveSentryEnvironment } from "src/lib/sentry/sentryInitOptions";

const TRANSIENT_DATABASE_CONNECTION_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ETIMEDOUT",
]);

const isTransientDatabaseConnectionError = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  const code = String((error as { code: unknown }).code);
  return TRANSIENT_DATABASE_CONNECTION_CODES.has(code);
};

export const shouldCaptureInfrastructureFailure = (
  area: InfrastructureFailureArea,
  error: unknown,
  extra?: Record<string, unknown>,
): boolean => {
  if (
    area === "database" &&
    extra?.source === "pool" &&
    isTransientDatabaseConnectionError(error) &&
    resolveSentryEnvironment() !== "production"
  ) {
    return false;
  }

  return true;
};
