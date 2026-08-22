import {
  computeDiscogsRateLimitWaitMs,
  getDiscogsRateLimitSnapshot,
} from "src/lib/discogs-rate-limit";

const DEFAULT_MIN_INTERVAL_MS = 1000;

function parseMinIntervalMs(): number {
  const parsed = Number.parseInt(
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS ||
      String(DEFAULT_MIN_INTERVAL_MS),
    10,
  );

  return Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : DEFAULT_MIN_INTERVAL_MS;
}

const fallbackIntervalMs = parseMinIntervalMs();

let lastRequestAt = 0;
let chain: Promise<unknown> = Promise.resolve();

export function runThrottledDiscogsRequest<T>(
  work: () => Promise<T>,
): Promise<T> {
  if (fallbackIntervalMs === 0 && !getDiscogsRateLimitSnapshot()) {
    return work();
  }

  const scheduled = chain.then(async () => {
    const now = Date.now();
    const waitMs = computeDiscogsRateLimitWaitMs({
      snapshot: getDiscogsRateLimitSnapshot(),
      lastRequestAt,
      now,
      fallbackIntervalMs,
    });

    if (waitMs > 0) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, waitMs);
      });
    }

    try {
      return await work();
    } finally {
      lastRequestAt = Date.now();
    }
  });

  chain = scheduled.then(
    () => undefined,
    () => undefined,
  );

  return scheduled;
}
