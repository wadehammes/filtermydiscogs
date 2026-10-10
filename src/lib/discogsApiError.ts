import { isDiscogsThrottleQueueError } from "src/lib/discogsThrottleQueueError";

export type DiscogsApiError = Error & {
  status?: number;
  retryAfterSeconds?: number;
};

export { isDiscogsThrottleQueueError };

export const DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS = 60;

export const asDiscogsApiError = (error: unknown): DiscogsApiError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  return error as DiscogsApiError;
};

export const getDiscogsApiErrorStatus = (error: unknown): number | undefined =>
  asDiscogsApiError(error)?.status;

export const getDiscogsRateLimitRetryAfterSeconds = (
  error: unknown,
): number => {
  const retryAfterSeconds = asDiscogsApiError(error)?.retryAfterSeconds;
  if (
    typeof retryAfterSeconds === "number" &&
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds > 0
  ) {
    return Math.ceil(retryAfterSeconds);
  }

  return DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS;
};

export const discogsRateLimitResponseInit = (
  error: unknown,
): {
  headers: { "Retry-After": string };
} => ({
  headers: {
    "Retry-After": String(getDiscogsRateLimitRetryAfterSeconds(error)),
  },
});

export const DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE =
  "Discogs returned an error (their servers may be overloaded or temporarily down). Try again in a few minutes.";

const DISCOGS_RATE_LIMIT_MESSAGE =
  "Rate limit exceeded. Please try again in a moment.";

export const mapDiscogsUpstreamToProxyStatus = (
  upstreamStatus: number | undefined,
  errorMessage: string,
): number => {
  if (
    upstreamStatus !== undefined &&
    upstreamStatus >= 500 &&
    upstreamStatus < 600
  ) {
    return 502;
  }

  if (upstreamStatus !== undefined) {
    return upstreamStatus;
  }

  if (errorMessage.toLowerCase().includes("too many requests")) {
    return 429;
  }

  return 500;
};

export interface BuildDiscogsProxyErrorPayloadParams {
  error: unknown;
  fallbackMessage: string;
}

export const discogsThrottleQueueResponseInit = (
  error: unknown,
): {
  status: 503;
  headers: { "Retry-After": string };
} => {
  const retryAfterSeconds = isDiscogsThrottleQueueError(error)
    ? error.retryAfterSeconds
    : 5;

  return {
    status: 503,
    headers: {
      "Retry-After": String(retryAfterSeconds),
    },
  };
};

export const getDiscogsProxyErrorMessage = (
  status: number,
  fallbackMessage: string,
): string => {
  if (status === 429) {
    return DISCOGS_RATE_LIMIT_MESSAGE;
  }
  if (status === 502) {
    return DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE;
  }
  return fallbackMessage;
};
