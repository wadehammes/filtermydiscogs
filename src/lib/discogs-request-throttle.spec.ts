import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

describe("discogs-request-throttle", () => {
  const originalInterval = process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS;
  const originalQueueTimeout = process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS;

  beforeEach(() => {
    jest.resetModules();
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = "50";
    delete process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS;
  });

  afterEach(() => {
    if (originalInterval === undefined) {
      delete process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS;
    } else {
      process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = originalInterval;
    }

    if (originalQueueTimeout === undefined) {
      delete process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS;
    } else {
      process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS = originalQueueTimeout;
    }
  });

  it("serializes Discogs requests with a minimum interval", async () => {
    const { runThrottledDiscogsRequest } = await import(
      "./discogs-request-throttle"
    );
    const startedAt = Date.now();

    await runThrottledDiscogsRequest(async () => undefined);
    await runThrottledDiscogsRequest(async () => undefined);

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(45);
  });

  it("lets the next request run after a prior request rejects", async () => {
    const { runThrottledDiscogsRequest } = await import(
      "./discogs-request-throttle"
    );
    const second = jest.fn(async () => "ok");

    await expect(
      runThrottledDiscogsRequest(async () => {
        throw new Error("Discogs request timed out");
      }),
    ).rejects.toThrow("Discogs request timed out");

    await expect(runThrottledDiscogsRequest(second)).resolves.toBe("ok");
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("runs nested throttle calls without deadlocking the queue", async () => {
    const { runThrottledDiscogsRequest } = await import(
      "./discogs-request-throttle"
    );

    await expect(
      runThrottledDiscogsRequest(async () =>
        runThrottledDiscogsRequest(async () => "nested"),
      ),
    ).resolves.toBe("nested");
  });

  it("rejects when waiting on the throttle queue exceeds the timeout", async () => {
    process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS = "40";
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = "50";
    jest.resetModules();

    const { runThrottledDiscogsRequest } = await import(
      "./discogs-request-throttle"
    );

    const stuck = runThrottledDiscogsRequest(async () => {
      await new Promise<void>(() => undefined);
      return "stuck";
    });
    stuck.catch(() => undefined);

    await expect(
      runThrottledDiscogsRequest(async () => "queued"),
    ).rejects.toThrow("Discogs throttle queue timed out");
  });
});
