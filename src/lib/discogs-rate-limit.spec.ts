import { describe, expect, it } from "@jest/globals";
import {
  computeDiscogsRateLimitWaitMs,
  type DiscogsRateLimitSnapshot,
  parseDiscogsRateLimitHeaders,
} from "src/lib/discogs-rate-limit";

function buildHeaders(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe("parseDiscogsRateLimitHeaders", () => {
  it("parses Discogs rate limit headers", () => {
    const snapshot = parseDiscogsRateLimitHeaders(
      buildHeaders({
        "X-Discogs-Ratelimit": "60",
        "X-Discogs-Ratelimit-Used": "12",
        "X-Discogs-Ratelimit-Remaining": "48",
      }),
    );

    expect(snapshot).toEqual(
      expect.objectContaining({
        limit: 60,
        used: 12,
        remaining: 48,
      }),
    );
  });

  it("returns null when any header is missing", () => {
    expect(
      parseDiscogsRateLimitHeaders(
        buildHeaders({
          "X-Discogs-Ratelimit": "60",
          "X-Discogs-Ratelimit-Used": "12",
        }),
      ),
    ).toBeNull();
  });
});

describe("computeDiscogsRateLimitWaitMs", () => {
  const now = 1_000_000;

  it("uses the fallback interval when no snapshot exists", () => {
    expect(
      computeDiscogsRateLimitWaitMs({
        snapshot: null,
        lastRequestAt: now - 200,
        now,
        fallbackIntervalMs: 1000,
      }),
    ).toBe(800);
  });

  it("paces faster when plenty of quota remains", () => {
    const snapshot: DiscogsRateLimitSnapshot = {
      limit: 60,
      used: 5,
      remaining: 55,
      recordedAt: now - 100,
    };

    expect(
      computeDiscogsRateLimitWaitMs({
        snapshot,
        lastRequestAt: now - 600,
        now,
        fallbackIntervalMs: 1000,
      }),
    ).toBe(0);
  });

  it("uses sustainable spacing when quota is moderate", () => {
    const snapshot: DiscogsRateLimitSnapshot = {
      limit: 60,
      used: 40,
      remaining: 20,
      recordedAt: now - 100,
    };

    expect(
      computeDiscogsRateLimitWaitMs({
        snapshot,
        lastRequestAt: now - 200,
        now,
        fallbackIntervalMs: 1000,
      }),
    ).toBe(800);
  });

  it("waits out the minute window when quota is exhausted", () => {
    const snapshot: DiscogsRateLimitSnapshot = {
      limit: 60,
      used: 60,
      remaining: 0,
      recordedAt: now - 10_000,
    };

    expect(
      computeDiscogsRateLimitWaitMs({
        snapshot,
        lastRequestAt: now - 500,
        now,
        fallbackIntervalMs: 1000,
      }),
    ).toBe(50_000);
  });
});
