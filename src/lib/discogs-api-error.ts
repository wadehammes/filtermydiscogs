import { isDiscogsThrottleQueueError } from "src/lib/discogs-request-throttle";

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

  let message = fallbackMessage;
  if (status === 429) {
    message = DISCOGS_RATE_LIMIT_MESSAGE;
  } else if (status === 502) {
    message = DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE;
  }

  const body: { details?: string; error: string } = { error: message };
  if (process.env.NODE_ENV === "development") {
    body.details = errorMessage;
  }

  return {
    body,
    status,
    ...(status === 429
      ? { rateLimitInit: discogsRateLimitResponseInit(error) }
      : {}),
  };
};

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
