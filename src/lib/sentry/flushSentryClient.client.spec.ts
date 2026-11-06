import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type * as Sentry from "@sentry/react";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("@sentry/react", () => ({
  getClient: jest.fn(),
  flush: jest.fn(),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

const mockGetClient = getMockedExport<typeof Sentry.getClient>(
  "@sentry/react",
  "getClient",
);

const mockFlush = getMockedExport<typeof Sentry.flush>(
  "@sentry/react",
  "flush",
);

const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

describe("flushSentryClient", () => {
  let flushSentryClient: typeof import("src/lib/sentry/flushSentryClient.client").flushSentryClient;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockResolveSentryEnabled.mockReturnValue(true);
    mockGetClient.mockReturnValue({} as ReturnType<typeof Sentry.getClient>);
    mockFlush.mockResolvedValue(true);
    ({ flushSentryClient } = await import(
      "src/lib/sentry/flushSentryClient.client"
    ));
  });

  it("when Sentry is disabled, returns false without flushing", async () => {
    mockResolveSentryEnabled.mockReturnValue(false);

    await expect(flushSentryClient()).resolves.toBe(false);
    expect(mockFlush).not.toHaveBeenCalled();
  });

  it("when the client is missing, returns false", async () => {
    mockGetClient.mockReturnValue(undefined);

    await expect(flushSentryClient()).resolves.toBe(false);
    expect(mockFlush).not.toHaveBeenCalled();
  });

  it("flushes the Sentry client with the default timeout", async () => {
    await expect(flushSentryClient()).resolves.toBe(true);
    expect(mockFlush).toHaveBeenCalledWith(2000);
  });
});
