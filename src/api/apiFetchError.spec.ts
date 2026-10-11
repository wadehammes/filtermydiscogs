import { describe, expect, it } from "@jest/globals";
import {
  ApiFetchError,
  isDiscogsUpstreamOutageApiError,
  parseRetryAfterMs,
} from "src/api/apiFetchError";

describe("apiFetchError", () => {
  it("parses Retry-After seconds", () => {
    const response = new Response(null, {
      headers: { "Retry-After": "60" },
    });

    expect(parseRetryAfterMs(response)).toBe(60_000);
  });

  it("returns undefined when Retry-After is missing", () => {
    expect(parseRetryAfterMs(new Response(null))).toBeUndefined();
  });

  it("returns undefined when headers are missing", () => {
    expect(
      parseRetryAfterMs({ headers: undefined } as unknown as Response),
    ).toBeUndefined();
  });

  it("isDiscogsUpstreamOutageApiError is true only for ApiFetchError with status 502", () => {
    expect(
      isDiscogsUpstreamOutageApiError(new ApiFetchError(502, "Unavailable")),
    ).toBe(true);
    expect(
      isDiscogsUpstreamOutageApiError(new ApiFetchError(503, "Rate limited")),
    ).toBe(false);
    expect(isDiscogsUpstreamOutageApiError(new Error("network"))).toBe(false);
  });
});
