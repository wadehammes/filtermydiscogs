import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { buildSentryClientInitOptions } from "src/lib/sentry/buildSentryClientInitOptions.client";

describe("buildSentryClientInitOptions", () => {
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

  it("merges replay and feedback integrations when Sentry is enabled", () => {
    const env = process.env as Record<string, string | undefined>;

    env.NEXT_PUBLIC_SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    env.NODE_ENV = "production";

    const options = buildSentryClientInitOptions();

    expect(
      options.integrations?.map((integration) => integration.name),
    ).toEqual(["Replay", "Feedback"]);
  });
});
