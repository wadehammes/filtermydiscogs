import {
  type BuildDiscogsProxyErrorPayloadParams,
  DISCOGS_THROTTLE_QUEUE_BUSY_MESSAGE,
  discogsRateLimitResponseInit,
  discogsThrottleQueueResponseInit,
  getDiscogsApiErrorStatus,
  getDiscogsProxyErrorMessage,
  isDiscogsThrottleQueueError,
  mapDiscogsUpstreamToProxyStatus,
} from "src/lib/discogsApiError";
import { reportApiRouteFailure } from "src/lib/sentry/reportApiRouteFailure";

export type { DiscogsApiError } from "src/lib/discogsApiError";
export {
  DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS,
  DISCOGS_THROTTLE_QUEUE_BUSY_MESSAGE,
  DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE,
  discogsRateLimitResponseInit,
  getDiscogsApiErrorStatus,
  getDiscogsRateLimitRetryAfterSeconds,
  isDiscogsFetchTimeoutError,
  isDiscogsInvalidTokenStatus,
  mapDiscogsUpstreamToProxyStatus,
  resolveDiscogsVerificationFailureStatus,
} from "src/lib/discogsApiError";

export const buildDiscogsProxyErrorPayload = ({
  error,
  fallbackMessage,
}: BuildDiscogsProxyErrorPayloadParams): {
  body: { details?: string; error: string };
  status: number;
  rateLimitInit?: ReturnType<typeof discogsRateLimitResponseInit>;
} => {
  if (isDiscogsThrottleQueueError(error)) {
    const throttleInit = discogsThrottleQueueResponseInit(error);

    return {
      body: { error: DISCOGS_THROTTLE_QUEUE_BUSY_MESSAGE },
      status: throttleInit.status,
      rateLimitInit: { headers: throttleInit.headers },
    };
  }

  const errorMessage = error instanceof Error ? error.message : fallbackMessage;
  const upstreamStatus = getDiscogsApiErrorStatus(error);
  const status = mapDiscogsUpstreamToProxyStatus(upstreamStatus, errorMessage);
  const message = getDiscogsProxyErrorMessage(status, fallbackMessage);

  const body: { details?: string; error: string } = { error: message };
  if (process.env.NODE_ENV === "development") {
    body.details = errorMessage;
  }

  reportApiRouteFailure("discogs-proxy", error, {
    status,
    extra: { fallbackMessage },
  });

  return {
    body,
    status,
    ...(status === 429
      ? { rateLimitInit: discogsRateLimitResponseInit(error) }
      : {}),
  };
};
