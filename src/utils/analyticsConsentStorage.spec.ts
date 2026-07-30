import { beforeEach, describe, expect, it } from "@jest/globals";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import {
  analyticsConsentChoiceToBoolean,
  booleanToAnalyticsConsentChoice,
  clearAnalyticsConsentChoice,
  isAnalyticsConsentGranted,
  readAnalyticsConsentChoice,
  readAnalyticsConsentState,
  writeAnalyticsConsentChoice,
} from "./analyticsConsentStorage";

describe("analyticsConsentStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns pending when no choice is stored", () => {
    expect(readAnalyticsConsentState()).toBe("pending");
    expect(readAnalyticsConsentChoice()).toBeNull();
    expect(isAnalyticsConsentGranted()).toBe(false);
  });

  it("reads and writes granted and denied choices", () => {
    writeAnalyticsConsentChoice("granted");

    expect(readAnalyticsConsentState()).toBe("granted");
    expect(readAnalyticsConsentChoice()).toBe("granted");
    expect(isAnalyticsConsentGranted()).toBe(true);
    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");

    writeAnalyticsConsentChoice("denied");

    expect(readAnalyticsConsentState()).toBe("denied");
    expect(isAnalyticsConsentGranted()).toBe(false);
  });

  it("treats invalid stored values as pending", () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "maybe");

    expect(readAnalyticsConsentState()).toBe("pending");
    expect(readAnalyticsConsentChoice()).toBeNull();
  });

  it("clears stored consent", () => {
    writeAnalyticsConsentChoice("granted");

    clearAnalyticsConsentChoice();

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBeNull();
    expect(readAnalyticsConsentState()).toBe("pending");
  });

  it("converts between boolean prefs and storage choices", () => {
    expect(booleanToAnalyticsConsentChoice(true)).toBe("granted");
    expect(booleanToAnalyticsConsentChoice(false)).toBe("denied");
    expect(analyticsConsentChoiceToBoolean("granted")).toBe(true);
    expect(analyticsConsentChoiceToBoolean("denied")).toBe(false);
  });
});
