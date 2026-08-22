export class ApiFetchError extends Error {
  readonly status: number;
  readonly retryAfterMs?: number;

  constructor(status: number, message?: string, retryAfterMs?: number) {
    super(message ?? `HTTP error! status: ${status}`);
    this.status = status;
    if (retryAfterMs !== undefined) {
      this.retryAfterMs = retryAfterMs;
    }
  }
}

export function parseRetryAfterMs(response: Response): number | undefined {
  const header = response.headers?.get("Retry-After");
  if (!header) {
    return undefined;
  }

  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds)) {
    return seconds * 1000;
  }

  return undefined;
}

export function isTransientRateLimitError(
  error: unknown,
): error is ApiFetchError {
  return (
    error instanceof ApiFetchError &&
    (error.status === 503 || error.status === 429)
  );
}

export function getRateLimitedRetryDelayMs(
  error: unknown,
  attemptIndex: number,
): number {
  if (error instanceof ApiFetchError && error.retryAfterMs !== undefined) {
    return error.retryAfterMs;
  }

  if (isTransientRateLimitError(error)) {
    return Math.min(60_000, 5_000 * 2 ** attemptIndex);
  }

  return 0;
}
