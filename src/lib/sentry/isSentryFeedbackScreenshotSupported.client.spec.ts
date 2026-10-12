import { describe, expect, it } from "@jest/globals";
import { isSentryFeedbackScreenshotSupported } from "src/lib/sentry/isSentryFeedbackScreenshotSupported.client";

describe("isSentryFeedbackScreenshotSupported", () => {
  it("when getDisplayMedia is unavailable, returns false", () => {
    const originalMediaDevices = navigator.mediaDevices;

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {},
    });

    expect(isSentryFeedbackScreenshotSupported()).toBe(false);

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: originalMediaDevices,
    });
  });
});
