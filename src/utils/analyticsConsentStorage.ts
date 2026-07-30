import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import type {
  AnalyticsConsentChoice,
  AnalyticsConsentState,
} from "src/types/analyticsConsent.types";

const isAnalyticsConsentChoice = (
  value: string | null,
): value is AnalyticsConsentChoice => value === "granted" || value === "denied";

export const readAnalyticsConsentState = (): AnalyticsConsentState => {
  if (typeof window === "undefined") {
    return "pending";
  }

  const stored = localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return isAnalyticsConsentChoice(stored) ? stored : "pending";
};

export const readAnalyticsConsentChoice = (): AnalyticsConsentChoice | null => {
  const state = readAnalyticsConsentState();
  return state === "pending" ? null : state;
};

export const writeAnalyticsConsentChoice = (
  choice: AnalyticsConsentChoice,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, choice);
};

export const clearAnalyticsConsentChoice = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
};

export const isAnalyticsConsentGranted = (): boolean =>
  readAnalyticsConsentState() === "granted";

export const analyticsConsentChoiceToBoolean = (
  choice: AnalyticsConsentChoice,
): boolean => choice === "granted";

export const booleanToAnalyticsConsentChoice = (
  enabled: boolean,
): AnalyticsConsentChoice => (enabled ? "granted" : "denied");
