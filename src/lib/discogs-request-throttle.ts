import { AsyncLocalStorage } from "node:async_hooks";
import {
  computeDiscogsRateLimitWaitMs,
  getDiscogsRateLimitSnapshot,
} from "src/lib/discogs-rate-limit";
import { getDiscogsThrottleCaller } from "src/lib/discogs-throttle-caller";
import { recordDiscogsThrottleTelemetry } from "src/lib/discogs-throttle-telemetry.server";
import { DiscogsThrottleQueueError } from "src/lib/discogsThrottleQueueError";

const DEFAULT_MIN_INTERVAL_MS = 1000;
const DEFAULT_QUEUE_WAIT_TIMEOUT_MS = 30_000;

const throttleContext = new AsyncLocalStorage<true>();

function parseEnvMs(
  name: string,
  fallback: number,
  { allowZero }: { allowZero: boolean },
): number {
  const parsed = Number.parseInt(process.env[name] || String(fallback), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (allowZero ? parsed < 0 : parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const fallbackIntervalMs = parseEnvMs(
  "DISCOGS_MIN_REQUEST_INTERVAL_MS",
  DEFAULT_MIN_INTERVAL_MS,
  { allowZero: true },
);
const queueWaitTimeoutMs = parseEnvMs(
  "DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS",
  DEFAULT_QUEUE_WAIT_TIMEOUT_MS,
  { allowZero: false },
);

let lastRequestAt = 0;
let chain: Promise<unknown> = Promise.resolve();

export const runThrottledDiscogsRequest = <T>(
  work: () => Promise<T>,
): Promise<T> => {
  if (throttleContext.getStore()) {
    return work();
  }

  if (fallbackIntervalMs === 0 && !getDiscogsRateLimitSnapshot()) {
    return throttleContext.run(true, work);
  }

  const queuedAt = Date.now();
  const caller = getDiscogsThrottleCaller();

  let releaseSlotWait!: () => void;
  const slotAcquired = new Promise<void>((resolve) => {
    releaseSlotWait = resolve;
  });

  let abandoned = false;

  const scheduled = chain.then(async () => {
    releaseSlotWait();

    if (abandoned) {
      return undefined;
    }

    const queueWaitMs = Date.now() - queuedAt;
    let rateLimitWaitMs = 0;

    try {
      return await throttleContext.run(true, async () => {
        const now = Date.now();
        const waitMs = computeDiscogsRateLimitWaitMs({
          snapshot: getDiscogsRateLimitSnapshot(),
          lastRequestAt,
          now,
          fallbackIntervalMs,
        });

        rateLimitWaitMs = waitMs;

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
    } finally {
      if (queueWaitMs > 0 || rateLimitWaitMs > 0) {
        recordDiscogsThrottleTelemetry({
          caller,
          queueWaitMs,
          rateLimitWaitMs,
          timedOut: false,
        });
      }
    }
  });

  chain = scheduled.then(
    () => undefined,
    () => undefined,
  );

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let queueWaitError: DiscogsThrottleQueueError | undefined;

  return (async () => {
    await Promise.race([
      slotAcquired,
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => {
          abandoned = true;
          queueWaitError = new DiscogsThrottleQueueError();
          resolve();
        }, queueWaitTimeoutMs);
      }),
    ]);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    if (queueWaitError) {
      recordDiscogsThrottleTelemetry({
        caller,
        queueWaitMs: Date.now() - queuedAt,
        rateLimitWaitMs: 0,
        timedOut: true,
      });
      throw queueWaitError;
    }

    return scheduled as Promise<T>;
  })();
};
