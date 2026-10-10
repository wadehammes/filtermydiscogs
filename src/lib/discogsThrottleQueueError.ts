export const DISCOGS_THROTTLE_QUEUE_RETRY_AFTER_SECONDS = 5;

export class DiscogsThrottleQueueError extends Error {
  readonly retryAfterSeconds = DISCOGS_THROTTLE_QUEUE_RETRY_AFTER_SECONDS;

  constructor() {
    super("Discogs throttle queue timed out");
    this.name = "DiscogsThrottleQueueError";
  }
}

export const isDiscogsThrottleQueueError = (
  error: unknown,
): error is DiscogsThrottleQueueError =>
  error instanceof DiscogsThrottleQueueError;
