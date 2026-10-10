"use client";

import { replayIntegration } from "@sentry/react";
import {
  resolveSentryReplayOnErrorSampleRate,
  resolveSentryReplaySessionSampleRate,
} from "src/lib/sentry/sentryInitOptions";

export const buildSentryReplayClientOptions = ():
  | {
      integrations: ReturnType<typeof replayIntegration>[];
      replaysSessionSampleRate: number;
      replaysOnErrorSampleRate: number;
    }
  | Record<string, never> => {
  const replaysSessionSampleRate = resolveSentryReplaySessionSampleRate();
  const replaysOnErrorSampleRate = resolveSentryReplayOnErrorSampleRate();

  if (replaysSessionSampleRate <= 0 && replaysOnErrorSampleRate <= 0) {
    return {};
  }

  return {
    integrations: [
      replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate,
    replaysOnErrorSampleRate,
  };
};
