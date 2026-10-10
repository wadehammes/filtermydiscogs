import { describe, expect, it } from "@jest/globals";
import { shouldReportHttpFailure } from "src/lib/sentry/shouldReportHttpFailure";

describe("shouldReportHttpFailure", () => {
  it("reports only HTTP 5xx; skips 4xx and missing status", () => {
    expect(shouldReportHttpFailure(undefined)).toBe(false);
    expect(shouldReportHttpFailure(500)).toBe(true);
    expect(shouldReportHttpFailure(502)).toBe(true);
    expect(shouldReportHttpFailure(503)).toBe(true);
    expect(shouldReportHttpFailure(400)).toBe(false);
    expect(shouldReportHttpFailure(401)).toBe(false);
    expect(shouldReportHttpFailure(404)).toBe(false);
    expect(shouldReportHttpFailure(409)).toBe(false);
    expect(shouldReportHttpFailure(429)).toBe(false);
    expect(shouldReportHttpFailure(499)).toBe(false);
  });
});
