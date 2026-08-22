import { describe, expect, it } from "@jest/globals";
import {
  DISCOGS_RATE_LIMIT_RETRY_AFTER_SECONDS,
  getDiscogsRateLimitRetryAfterSeconds,
} from "./discogs-api-error";

describe("discogs-api-error", () => {
  it("returns upstream retry-after seconds when present on the error", () => {
    const error = Object.assign(new Error("Too many requests"), {
      status: 429,
      retryAfterSeconds: 30,
    });

    expect(getDiscogsRateLimitRetryAfterSeconds(error)).toBe(30);
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
