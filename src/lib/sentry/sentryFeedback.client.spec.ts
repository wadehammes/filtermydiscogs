import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import { buildSentryFeedbackClientOptions } from "src/lib/sentry/sentryFeedback.client";

describe("buildSentryFeedbackClientOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_ENABLE_DEV;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns feedback integration with autoInject disabled when Sentry is enabled", () => {
    const env = process.env as Record<string, string | undefined>;

    env.NEXT_PUBLIC_SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    env.NODE_ENV = "production";

    const options = buildSentryFeedbackClientOptions();

    expect(options.integrations).toHaveLength(1);
    expect(options.integrations?.[0]?.name).toBe("Feedback");
  });

  it("returns an empty object when Sentry is disabled", () => {
    expect(buildSentryFeedbackClientOptions()).toEqual({});
  });
});
