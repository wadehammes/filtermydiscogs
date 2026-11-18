import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const mockSetAttribute = jest.fn();
const mockGetActiveSpan = jest.fn(() => ({
  setAttribute: mockSetAttribute,
}));

jest.mock("@sentry/nextjs", () => ({
  getActiveSpan: () => mockGetActiveSpan(),
}));

describe("discogs-throttle-telemetry.server", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets throttle attributes on the active span when queue or rate-limit waits occurred", async () => {
    const { recordDiscogsThrottleTelemetry } = await import(
      "src/lib/discogs-throttle-telemetry.server"
    );

    recordDiscogsThrottleTelemetry({
      caller: "api_release",
      queueWaitMs: 1200,
      rateLimitWaitMs: 1000,
      timedOut: false,
    });

    expect(mockSetAttribute).toHaveBeenCalledWith(
      "discogs.throttle.caller",
      "api_release",
    );
    expect(mockSetAttribute).toHaveBeenCalledWith(
      "discogs.throttle.queue_wait_ms",
      1200,
    );
    expect(mockSetAttribute).toHaveBeenCalledWith(
      "discogs.throttle.rate_limit_wait_ms",
      1000,
    );
  });

  it("does nothing when there is no active span", async () => {
    mockGetActiveSpan.mockReturnValueOnce(undefined as never);

    const { recordDiscogsThrottleTelemetry } = await import(
      "src/lib/discogs-throttle-telemetry.server"
    );

    recordDiscogsThrottleTelemetry({
      caller: "public_playlist_hydrate",
      queueWaitMs: 500,
      rateLimitWaitMs: 0,
      timedOut: false,
    });

    expect(mockSetAttribute).not.toHaveBeenCalled();
  });
});
