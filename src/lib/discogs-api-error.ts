export type DiscogsApiError = Error & {
  status?: number;
  retryAfterSeconds?: number;
};

export const DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS = 60;

export function asDiscogsApiError(error: unknown): DiscogsApiError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  return error as DiscogsApiError;
}

export function getDiscogsApiErrorStatus(error: unknown): number | undefined {
  return asDiscogsApiError(error)?.status;
}

export function getDiscogsRateLimitRetryAfterSeconds(error: unknown): number {
  const retryAfterSeconds = asDiscogsApiError(error)?.retryAfterSeconds;
  if (
    typeof retryAfterSeconds === "number" &&
    Number.isFinite(retryAfterSeconds) &&
    retryAfterSeconds > 0
  ) {
    return Math.ceil(retryAfterSeconds);
  }

  return DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS;
}

export function discogsRateLimitResponseInit(error: unknown): {
  headers: { "Retry-After": string };
} {
  return {
    headers: {
      "Retry-After": String(getDiscogsRateLimitRetryAfterSeconds(error)),
    },
  };
}
