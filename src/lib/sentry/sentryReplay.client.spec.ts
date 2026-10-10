import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { buildSentryReplayClientOptions } from "src/lib/sentry/sentryReplay.client";

describe("buildSentryReplayClientOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_ENABLE_DEV;
    delete process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE;
    delete process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns replay integration and default sample rates when Sentry is enabled in production", () => {
    const env = process.env as Record<string, string | undefined>;

    env.NEXT_PUBLIC_SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    env.NODE_ENV = "production";

    const options = buildSentryReplayClientOptions();

    expect(options.replaysSessionSampleRate).toBe(0.1);
    expect(options.replaysOnErrorSampleRate).toBe(1);
    expect(options.integrations).toHaveLength(1);
    expect(options.integrations?.[0]?.name).toBe("Replay");
  });

  it("returns an empty object when Sentry is disabled", () => {
    const env = process.env as Record<string, string | undefined>;

    env.NODE_ENV = "production";

    expect(buildSentryReplayClientOptions()).toEqual({});
  });
});
