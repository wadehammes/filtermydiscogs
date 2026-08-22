import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

describe("discogs-request-throttle", () => {
  const originalInterval = process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS;

  beforeEach(() => {
    jest.resetModules();
    process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = "50";
  });

  afterEach(() => {
    if (originalInterval === undefined) {
      delete process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS;
    } else {
      process.env.DISCOGS_MIN_REQUEST_INTERVAL_MS = originalInterval;
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
});
