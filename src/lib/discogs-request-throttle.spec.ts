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

  it("runs interactive waiters before background when the slot frees", async () => {
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = "1";
    jest.resetModules();

    const order: string[] = [];
    const { DISCOGS_THROTTLE_CALLERS } = await import(
      "src/constants/discogsThrottleCaller.constants"
    );
    const { runWithDiscogsThrottleCaller } = await import(
      "./discogs-throttle-caller"
    );
    const { runThrottledDiscogsRequest } = await import(
      "./discogs-request-throttle"
    );

    let releaseBlock!: () => void;
    const blockGate = new Promise<void>((resolve) => {
      releaseBlock = resolve;
    });

    const blocking = runWithDiscogsThrottleCaller(
      DISCOGS_THROTTLE_CALLERS.publicPlaylistHydrate,
      () =>
        runThrottledDiscogsRequest(async () => {
          order.push("block-start");
          await blockGate;
          order.push("block-end");
        }),
    );

    await Promise.resolve();

    const background = runWithDiscogsThrottleCaller(
      DISCOGS_THROTTLE_CALLERS.publicPlaylistHydrate,
      () =>
        runThrottledDiscogsRequest(async () => {
          order.push("background");
        }),
    );

    const interactive = runWithDiscogsThrottleCaller(
      DISCOGS_THROTTLE_CALLERS.apiRelease,
      () =>
        runThrottledDiscogsRequest(async () => {
          order.push("interactive");
        }),
    );

    releaseBlock();
    await Promise.all([blocking, background, interactive]);

    expect(order).toEqual([
      "block-start",
      "block-end",
      "interactive",
      "background",
    ]);
  });

  it("rejects when waiting on the throttle queue exceeds the timeout", async () => {
    process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS = "40";
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = "50";
    jest.resetModules();

    const { DiscogsThrottleQueueError } = await import(
      "./discogsThrottleQueueError"
    );
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
    ).rejects.toBeInstanceOf(DiscogsThrottleQueueError);
  });

  it("when the throttle queue times out, does not emit an unhandled rejection", async () => {
    process.env.DISCOGS_THROTTLE_QUEUE_TIMEOUT_MS = "40";
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = "50";
    jest.resetModules();

    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => {
      unhandledRejections.push(reason);
    };
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      const { DiscogsThrottleQueueError } = await import(
        "./discogsThrottleQueueError"
      );
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
      ).rejects.toBeInstanceOf(DiscogsThrottleQueueError);

      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });

      expect(unhandledRejections).toEqual([]);
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });
});
