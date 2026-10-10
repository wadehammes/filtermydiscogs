"use client";

import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.client";

export type ClientFailureDomain =
  | "account"
  | "crate"
  | "dashboard"
  | "donation"
  | "error_boundary";

export const reportClientFailure = (
  domain: ClientFailureDomain,
  error: unknown,
  extra?: Record<string, unknown>,
) => {
  reportTaggedAppError(
    {
      "client.domain": domain,
    },
    error,
    {
      gateHttpStatusFromError: true,
      ...(extra ? { extra } : {}),
    },
  );
};
