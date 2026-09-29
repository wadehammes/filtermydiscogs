import { describe, expect, it } from "@jest/globals";
import {
  buildDiscogsProxyErrorPayload,
  DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS,
  DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE,
  getDiscogsRateLimitRetryAfterSeconds,
  mapDiscogsUpstreamToProxyStatus,
} from "./discogs-api-error";

describe("discogs-api-error", () => {
  it("returns upstream retry-after seconds when present on the error", () => {
    const error = Object.assign(new Error("Too many requests"), {
      status: 429,
      retryAfterSeconds: 30,
    });

    expect(getDiscogsRateLimitRetryAfterSeconds(error)).toBe(30);
  });

  it("maps upstream Discogs 5xx to 502 for app proxies", () => {
    expect(mapDiscogsUpstreamToProxyStatus(500, "Internal Server Error")).toBe(
      502,
    );
    expect(mapDiscogsUpstreamToProxyStatus(503, "Service Unavailable")).toBe(
      502,
    );
    expect(mapDiscogsUpstreamToProxyStatus(429, "Too many requests")).toBe(429);
    expect(mapDiscogsUpstreamToProxyStatus(undefined, "network")).toBe(500);
  });

  it("builds proxy error payloads for release-style routes", () => {
    const upstreamError = Object.assign(new Error("Internal Server Error"), {
      status: 500,
    });

    expect(
      buildDiscogsProxyErrorPayload({
        error: upstreamError,
        fallbackMessage: "Failed to fetch release",
      }),
    ).toEqual({
      body: { error: DISCOGS_UPSTREAM_UNAVAILABLE_MESSAGE },
      status: 502,
    });
  });

  it("falls back to the default retry-after when upstream value is missing", () => {
    const error = Object.assign(new Error("Too many requests"), {
      status: 429,
    });

    expect(getDiscogsRateLimitRetryAfterSeconds(error)).toBe(
      DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS,
    );
  });
});
