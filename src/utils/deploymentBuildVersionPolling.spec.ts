import { afterEach, describe, expect, it } from "@jest/globals";
import {
  buildVersionRefetchIntervalMs,
  DEPLOYMENT_UPDATE_POLL_INTERVAL_MS,
  shouldEagerRefetchBuildVersionOnVisibility,
} from "src/utils/deploymentBuildVersionPolling";

describe("deploymentBuildVersionPolling", () => {
  afterEach(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
  });

  it("does not poll when deployment checks are disabled", () => {
    expect(buildVersionRefetchIntervalMs(false)).toBe(false);
  });

  it("polls every minute while the tab is visible", () => {
    expect(DEPLOYMENT_UPDATE_POLL_INTERVAL_MS).toBe(60_000);
    expect(buildVersionRefetchIntervalMs(true)).toBe(60_000);
  });

  it("pauses polling while the tab is hidden", () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });

    expect(buildVersionRefetchIntervalMs(true)).toBe(false);
  });

  it("eager-refetches only when the tab becomes visible", () => {
    expect(shouldEagerRefetchBuildVersionOnVisibility("visible")).toBe(true);
    expect(shouldEagerRefetchBuildVersionOnVisibility("hidden")).toBe(false);
  });
});
