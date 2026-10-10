import type { SeverityLevel } from "@sentry/core";

export type AppCaptureScopeContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: SeverityLevel;
  fingerprint?: string[];
};
