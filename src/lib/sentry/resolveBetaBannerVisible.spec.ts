import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import { getMockedExport } from "src/tests/mocks/getMockedExport";

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  resolveSentryEnabled: jest.fn(),
}));

const mockResolveSentryEnabled = getMockedExport<typeof resolveSentryEnabled>(
  "src/lib/sentry/sentryInitOptions",
  "resolveSentryEnabled",
);

describe("resolveBetaBannerVisible", () => {
  let resolveBetaBannerVisible: typeof import("src/lib/sentry/resolveBetaBannerVisible").resolveBetaBannerVisible;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ resolveBetaBannerVisible } = await import(
      "src/lib/sentry/resolveBetaBannerVisible"
    ));
  });

  it("when Sentry is disabled, returns false", () => {
    mockResolveSentryEnabled.mockReturnValue(false);

    expect(resolveBetaBannerVisible()).toBe(false);
  });

  it("when Sentry is enabled, returns true", () => {
    mockResolveSentryEnabled.mockReturnValue(true);

    expect(resolveBetaBannerVisible()).toBe(true);
  });
});
