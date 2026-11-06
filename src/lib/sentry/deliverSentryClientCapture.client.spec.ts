import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { flushSentryClient } from "src/lib/sentry/flushSentryClient.client";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("src/lib/sentry/flushSentryClient.client", () => ({
  flushSentryClient: jest.fn(),
}));

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

const mockFlushSentryClient = getMockedExport<typeof flushSentryClient>(
  "src/lib/sentry/flushSentryClient.client",
  "flushSentryClient",
);

const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

describe("deliverSentryClientCapture", () => {
  let deliverSentryClientCapture: typeof import("src/lib/sentry/deliverSentryClientCapture.client").deliverSentryClientCapture;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockResolveSentryEnabled.mockReturnValue(true);
    mockFlushSentryClient.mockResolvedValue(true);
    ({ deliverSentryClientCapture } = await import(
      "src/lib/sentry/deliverSentryClientCapture.client"
    ));
  });

  it("when Sentry is disabled, returns false without running capture", async () => {
    mockResolveSentryEnabled.mockReturnValue(false);
    const capture = jest.fn();

    await expect(deliverSentryClientCapture(capture)).resolves.toBe(false);

    expect(capture).not.toHaveBeenCalled();
    expect(mockFlushSentryClient).not.toHaveBeenCalled();
  });

  it("when Sentry is enabled, runs capture then flush", async () => {
    const capture = jest.fn();

    await expect(deliverSentryClientCapture(capture)).resolves.toBe(true);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(mockFlushSentryClient).toHaveBeenCalledTimes(1);
  });

  it("when flush fails, returns false", async () => {
    mockFlushSentryClient.mockResolvedValue(false);
    const capture = jest.fn();

    await expect(deliverSentryClientCapture(capture)).resolves.toBe(false);

    expect(capture).toHaveBeenCalledTimes(1);
  });
});
