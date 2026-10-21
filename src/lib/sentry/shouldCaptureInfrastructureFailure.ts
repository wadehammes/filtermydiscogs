import { isTransientDatabaseConnectionFailure } from "src/lib/databaseConnectionErrorMessage";
import type { InfrastructureFailureArea } from "src/lib/sentry/reportInfrastructureFailure";
import { resolveSentryEnvironment } from "src/lib/sentry/sentryInitOptions";

export const shouldCaptureInfrastructureFailure = (
  area: InfrastructureFailureArea,
  error: unknown,
  extra?: Record<string, unknown>,
): boolean => {
  if (
    area === "database" &&
    extra?.source === "pool" &&
    isTransientDatabaseConnectionFailure(error) &&
    resolveSentryEnvironment() !== "production"
  ) {
    return false;
  }

  return true;
};
