"use client";

import type { SeverityLevel } from "@sentry/core";
import { reportTaggedAppError } from "src/lib/sentry/reportTaggedAppError.client";
import { sentryUserVisibleTag } from "src/lib/sentry/sentryUserVisibleTag";

export type ClientFailureDomain =
  | "account"
  | "crate"
  | "dashboard"
  | "donation"
  | "error_boundary"
  | "mosaic";

export type ReportClientFailureOptions = {
  fingerprint?: string[];
  level?: SeverityLevel;
};

const CLIENT_FAILURE_USER_VISIBLE: Record<ClientFailureDomain, boolean> = {
  account: true,
  crate: true,
  dashboard: false,
  donation: true,
  error_boundary: true,
  mosaic: true,
};

export const reportClientFailure = (
  domain: ClientFailureDomain,
  error: unknown,
  extra?: Record<string, unknown>,
  options?: ReportClientFailureOptions,
) => {
  reportTaggedAppError(
    {
      "client.domain": domain,
      ...sentryUserVisibleTag(CLIENT_FAILURE_USER_VISIBLE[domain]),
    },
    error,
    {
      gateHttpStatusFromError: true,
      ...(extra ? { extra } : {}),
      ...(options?.level ? { level: options.level } : {}),
      ...(options?.fingerprint ? { fingerprint: options.fingerprint } : {}),
    },
  );
};
