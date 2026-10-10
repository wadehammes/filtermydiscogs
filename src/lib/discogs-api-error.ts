import {
  type BuildDiscogsProxyErrorPayloadParams,
  discogsRateLimitResponseInit,
  getDiscogsApiErrorStatus,
  getDiscogsProxyErrorMessage,
  mapDiscogsUpstreamToProxyStatus,
} from "src/lib/discogsApiError";
import { reportApiRouteFailure } from "src/lib/sentry/reportApiRouteFailure";

export type { DiscogsApiError } from "src/lib/discogsApiError";
export {
  DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS,
  DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE,
  discogsRateLimitResponseInit,
  discogsThrottleQueueResponseInit,
  getDiscogsRateLimitRetryAfterSeconds,
  isDiscogsThrottleQueueError,
  mapDiscogsUpstreamToProxyStatus,
} from "src/lib/discogsApiError";

export const buildDiscogsProxyErrorPayload = ({
  error,
  fallbackMessage,
}: BuildDiscogsProxyErrorPayloadParams): {
  body: { details?: string; error: string };
  status: number;
  rateLimitInit?: ReturnType<typeof discogsRateLimitResponseInit>;
} => {
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
