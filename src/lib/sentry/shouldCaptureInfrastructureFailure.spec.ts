import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { shouldCaptureInfrastructureFailure } from "src/lib/sentry/shouldCaptureInfrastructureFailure";

describe("shouldCaptureInfrastructureFailure", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("skips transient pool errors outside production", () => {
    process.env.VERCEL_ENV = "preview";

    expect(
      shouldCaptureInfrastructureFailure(
        "database",
        { code: "ECONNRESET" },
        { source: "pool" },
      ),
    ).toBe(false);
  });

  it("still captures transient pool errors in production", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.SENTRY_ENVIRONMENT;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;

    expect(
      shouldCaptureInfrastructureFailure(
        "database",
        { code: "ECONNRESET" },
        { source: "pool" },
      ),
    ).toBe(true);
  });

  it("captures non-pool database failures in preview", () => {
    process.env.VERCEL_ENV = "preview";

    expect(
      shouldCaptureInfrastructureFailure(
        "database",
        { code: "ECONNRESET" },
        { source: "initial_health_check" },
      ),
    ).toBe(true);
  });

  it("treats common pg pool connection reset codes as transient", () => {
    process.env.VERCEL_ENV = "preview";

    expect(
      shouldCaptureInfrastructureFailure(
        "database",
        { code: "ETIMEDOUT" },
        { source: "pool" },
      ),
    ).toBe(false);
    expect(
      shouldCaptureInfrastructureFailure("database", new Error("boom"), {
        source: "pool",
      }),
    ).toBe(true);
  });

  it("skips pool message-only transient connection errors outside production", () => {
    process.env.VERCEL_ENV = "preview";

    expect(
      shouldCaptureInfrastructureFailure(
        "database",
        new Error("Connection terminated unexpectedly"),
        { source: "pool" },
      ),
    ).toBe(false);
  });
});
