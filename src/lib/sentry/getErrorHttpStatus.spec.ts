import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import { getErrorHttpStatus } from "src/lib/sentry/getErrorHttpStatus";

describe("getErrorHttpStatus", () => {
  it("returns ApiFetchError status for client fetch failures", () => {
    expect(getErrorHttpStatus(new ApiFetchError(429, "Rate limited"))).toBe(
      429,
    );
    expect(getErrorHttpStatus(new ApiFetchError(502, "Bad gateway"))).toBe(502);
  });

  it("returns undefined for errors without a known HTTP status", () => {
    expect(getErrorHttpStatus(new Error("boom"))).toBeUndefined();
    expect(getErrorHttpStatus(null)).toBeUndefined();
  });
});
