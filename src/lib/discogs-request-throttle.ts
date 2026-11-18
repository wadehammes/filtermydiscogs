import { AsyncLocalStorage } from "node:async_hooks";
import {
  DISCOGS_THROTTLE_PRIORITY_VALUES,
  resolveDiscogsThrottlePriority,
} from "src/constants/discogsThrottlePriority.constants";
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

type ThrottleJob<T> = {
  priority: number;
  queuedAt: number;
  caller: ReturnType<typeof getDiscogsThrottleCaller>;
  work: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  started: boolean;
  clearQueueTimeout: () => void;
};

const pendingJobs: ThrottleJob<unknown>[] = [];
let pumpPromise: Promise<void> = Promise.resolve();

const compareThrottleJobs = (
  left: ThrottleJob<unknown>,
  right: ThrottleJob<unknown>,
): number => right.priority - left.priority || left.queuedAt - right.queuedAt;

const runThrottleJob = async <T>(job: ThrottleJob<T>): Promise<void> => {
  const queueWaitMs = Date.now() - job.queuedAt;
  let rateLimitWaitMs = 0;

  try {
    const result = await throttleContext.run(true, async () => {
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
        return await job.work();
      } finally {
        lastRequestAt = Date.now();
      }
    });

    if (queueWaitMs > 0 || rateLimitWaitMs > 0) {
      recordDiscogsThrottleTelemetry({
        caller: job.caller,
        queueWaitMs,
        rateLimitWaitMs,
        timedOut: false,
      });
    }

    job.resolve(result);
  } catch (error) {
    if (queueWaitMs > 0 || rateLimitWaitMs > 0) {
      recordDiscogsThrottleTelemetry({
        caller: job.caller,
        queueWaitMs,
        rateLimitWaitMs,
        timedOut: false,
      });
    }

    job.reject(error);
  }
};

const pumpThrottleQueue = async (): Promise<void> => {
  while (pendingJobs.length > 0) {
    pendingJobs.sort(compareThrottleJobs);
    const next = pendingJobs.shift() as ThrottleJob<unknown>;
    next.started = true;
    next.clearQueueTimeout();
    await runThrottleJob(next);
  }
};

const schedulePump = (): void => {
  pumpPromise = pumpPromise.then(pumpThrottleQueue, pumpThrottleQueue);
};

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
  const priorityKey = resolveDiscogsThrottlePriority(caller);
  const priority = DISCOGS_THROTTLE_PRIORITY_VALUES[priorityKey];

  return new Promise<T>((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const job: ThrottleJob<T> = {
      priority,
      queuedAt,
      caller,
      work,
      resolve,
      reject,
      started: false,
      clearQueueTimeout: () => {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
          timeoutId = undefined;
        }
      },
    };

    timeoutId = setTimeout(() => {
      if (job.started) {
        return;
      }

      const index = pendingJobs.indexOf(job as ThrottleJob<unknown>);
      if (index >= 0) {
        pendingJobs.splice(index, 1);
      }

      recordDiscogsThrottleTelemetry({
        caller,
        queueWaitMs: Date.now() - queuedAt,
        rateLimitWaitMs: 0,
        timedOut: true,
      });
      reject(new DiscogsThrottleQueueError());
    }, queueWaitTimeoutMs);

    pendingJobs.push(job as ThrottleJob<unknown>);
    schedulePump();
  });
};
