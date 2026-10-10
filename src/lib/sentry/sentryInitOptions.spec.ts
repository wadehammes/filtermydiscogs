import {
  buildBrowserSentryInitOptions,
  resolveSentryBrowserTunnel,
  resolveSentryDsn,
  resolveSentryEnabled,
} from "src/lib/sentry/sentryInitOptions";

describe("sentryInitOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_ENABLE_DEV;
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns undefined when no DSN is configured", () => {
    expect(resolveSentryDsn()).toBeUndefined();
    expect(resolveSentryEnabled()).toBe(false);
  });

  it("prefers SENTRY_DSN over NEXT_PUBLIC_SENTRY_DSN", () => {
    process.env.SENTRY_DSN = "https://server@o1.ingest.sentry.io/1";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@o1.ingest.sentry.io/2";

    expect(resolveSentryDsn()).toBe("https://server@o1.ingest.sentry.io/1");
  });

  it("disables Sentry in test, e2e mock builds, and local dev by default", () => {
    const env = process.env as Record<string, string | undefined>;

    env.SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    env.NODE_ENV = "test";

    expect(resolveSentryEnabled()).toBe(false);

    env.NODE_ENV = "production";
    env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";

    expect(resolveSentryEnabled()).toBe(false);

    env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "0";
    env.NODE_ENV = "development";

    expect(resolveSentryEnabled()).toBe(false);

    env.SENTRY_ENABLE_DEV = "1";

    expect(resolveSentryEnabled()).toBe(true);
  });

  it("enables Sentry in production when a DSN is set", () => {
    const env = process.env as Record<string, string | undefined>;

    env.NEXT_PUBLIC_SENTRY_DSN = "https://example@o1.ingest.sentry.io/1";
    env.NODE_ENV = "production";

    expect(resolveSentryEnabled()).toBe(true);
  });

  it("builds the browser tunnel path for Sentry SaaS DSNs", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      "https://key@o4512232195883008.ingest.us.sentry.io/4512232199618560";

    expect(resolveSentryBrowserTunnel()).toBe(
      "/monitoring?o=4512232195883008&p=4512232199618560&r=us",
    );
    expect(buildBrowserSentryInitOptions().tunnel).toBe(
      "/monitoring?o=4512232195883008&p=4512232199618560&r=us",
    );
  });
});
