import { afterEach, describe, expect, it } from "@jest/globals";
import type { Integration } from "@sentry/core";
import {
  buildServerSentryInitOptions,
  resolveServerTracesSampleRate,
} from "src/lib/buildServerSentryInitOptions.server";

describe("resolveServerTracesSampleRate", () => {
  const env = process.env as Record<string, string | undefined>;
  const previousNodeEnv = env.NODE_ENV;

  afterEach(() => {
    env.NODE_ENV = previousNodeEnv;
  });

  it("when NODE_ENV is production, samples at 5%", () => {
    env.NODE_ENV = "production";
    expect(resolveServerTracesSampleRate()).toBe(0.05);
  });
});

describe("buildServerSentryInitOptions", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("when Sentry is enabled in production, adds prismaIntegration", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      NEXT_PUBLIC_SENTRY_DSN: "https://example@o1.ingest.sentry.io/1",
    };
    delete process.env.SENTRY_ENABLE_DEV;
    delete process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV;
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;

    const options = buildServerSentryInitOptions();
    const defaults: Integration[] = [{ name: "MockDefault" }];
    const integrations = options.integrations?.(defaults) ?? [];

    expect(integrations.length).toBeGreaterThan(defaults.length);
    expect(
      integrations.some(
        (integration: Integration) => integration.name === "Prisma",
      ),
    ).toBe(true);
  });
});
