import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { act, renderHook, TestProviders, waitFor } from "test-utils";
import { useAnalyticsConsent } from "./analyticsConsent.context";

const renderAnalyticsConsentHook = () =>
  renderHook(() => useAnalyticsConsent(), {
    wrapper: ({ children }) => (
      <TestProviders authInitialState={testAuthenticatedAuthState}>
        {children}
      </TestProviders>
    ),
  });

describe("AnalyticsConsentProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates stored consent on mount", async () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");

    const { result } = renderAnalyticsConsentHook();

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
      expect(result.current.isAnalyticsEnabled).toBe(true);
      expect(result.current.hasChosen).toBe(true);
    });
  });

  it("accepts analytics and updates local storage", async () => {
    const { result } = renderAnalyticsConsentHook();

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    act(() => {
      result.current.acceptAnalytics();
    });

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(result.current.isAnalyticsEnabled).toBe(true);
  });

  it("rejects analytics and updates local storage", async () => {
    const { result } = renderAnalyticsConsentHook();

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    act(() => {
      result.current.rejectAnalytics();
    });

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
    expect(result.current.isAnalyticsEnabled).toBe(false);
  });

  it("syncs server preference into local storage and context state", async () => {
    const { result } = renderAnalyticsConsentHook();

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    act(() => {
      result.current.syncFromServerPreference(false);
    });

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("denied");
    expect(result.current.isAnalyticsEnabled).toBe(false);
  });

  it("updates consent through setAnalyticsEnabled", async () => {
    const { result } = renderAnalyticsConsentHook();

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    act(() => {
      result.current.setAnalyticsEnabled(true);
    });

    expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe("granted");
    expect(result.current.isAnalyticsEnabled).toBe(true);
  });

  it("throws when useAnalyticsConsent is used outside the provider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAnalyticsConsent());
    }).toThrow(
      "useAnalyticsConsent must be used within AnalyticsConsentProvider",
    );

    consoleSpy.mockRestore();
  });
});
