import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { DiscogsThrottleCaller } from "src/constants/discogsThrottleCaller.constants";

export type DiscogsThrottleTelemetry = {
  caller: DiscogsThrottleCaller | undefined;
  queueWaitMs: number;
  rateLimitWaitMs: number;
  timedOut: boolean;
};

export const recordDiscogsThrottleTelemetry = ({
  caller,
  queueWaitMs,
  rateLimitWaitMs,
  timedOut,
}: DiscogsThrottleTelemetry): void => {
  const span = Sentry.getActiveSpan();
  if (!span) {
    return;
  }

  if (caller) {
    span.setAttribute("discogs.throttle.caller", caller);
  }

  if (queueWaitMs > 0) {
    span.setAttribute("discogs.throttle.queue_wait_ms", queueWaitMs);
  }

  if (rateLimitWaitMs > 0) {
    span.setAttribute("discogs.throttle.rate_limit_wait_ms", rateLimitWaitMs);
  }

  if (timedOut) {
    span.setAttribute("discogs.throttle.queue_timed_out", true);
  }
};
