import "server-only";

import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.server";

export type InfrastructureFailureArea =
  | "database"
  | "admin_stats"
  | "public_crate";

const throttledReportKeys = new Map<string, number>();

export type ReportInfrastructureFailureOptions = {
  throttleKey?: string;
  throttleMs?: number;
};

export const reportInfrastructureFailure = (
  area: InfrastructureFailureArea,
  error: unknown,
  extra?: Record<string, unknown>,
  options?: ReportInfrastructureFailureOptions,
) => {
  const throttleKey = options?.throttleKey;
  const throttleMs = options?.throttleMs;
  if (throttleKey && throttleMs) {
    const lastReportAt = throttledReportKeys.get(throttleKey) ?? 0;
    const now = Date.now();
    if (now - lastReportAt < throttleMs) {
      return;
    }
    throttledReportKeys.set(throttleKey, now);
  }

  reportTaggedAppError(
    {
      "infrastructure.area": area,
    },
    error,
    extra ? { extra } : undefined,
  );
};
