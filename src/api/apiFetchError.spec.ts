import { describe, expect, it } from "@jest/globals";
import { parseRetryAfterMs } from "src/api/apiFetchError";

describe("parseRetryAfterMs", () => {
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
});
