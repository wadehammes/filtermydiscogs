import "server-only";

import type { Integration } from "@sentry/core";
import * as Sentry from "@sentry/nextjs";
import {
  buildSharedSentryInitOptions,
  resolveSentryEnabled,
} from "src/lib/sentry/sentryInitOptions";

export const resolveServerTracesSampleRate = (): number =>
  process.env.NODE_ENV === "production" ? 0.05 : 0;

export const buildServerSentryInitOptions = () => {
  const tracesSampleRate = resolveServerTracesSampleRate();

  return {
    ...buildSharedSentryInitOptions(),
    tracesSampleRate,
    integrations: (defaultIntegrations: Integration[]) => {
      if (!resolveSentryEnabled() || tracesSampleRate <= 0) {
        return defaultIntegrations;
      }

      return [...defaultIntegrations, Sentry.prismaIntegration()];
    },
  };
};
