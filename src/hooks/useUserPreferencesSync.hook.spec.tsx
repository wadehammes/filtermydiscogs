import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import { api } from "src/api/urls";
import {
  pendingFiltersRestoreAtom,
  persistedFiltersAtom,
  sessionFiltersAtom,
} from "src/atoms/filters.atoms";
import { viewStateAtom } from "src/atoms/view.atoms";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "src/constants/storageKeys";
import { useUserPreferencesSync } from "src/hooks/useUserPreferencesSync.hook";
import {
  persistedFiltersFactory,
  userPreferencesFactory,
} from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testProviders";
import { resetFilterPersistenceCache } from "src/utils/filterPersistence";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { resetUserPreferencesPersistQueue } from "src/utils/userPreferencesPersistQueue";
import { markFiltersPendingPersist } from "src/utils/userPreferencesSyncState";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    userPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
  },
}));

const mockFetchUserPreferences = jest.mocked(api.userPreferences);
const mockUpdateUserPreferences = jest.mocked(api.updateUserPreferences);

describe("useUserPreferencesSync", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFilterPersistenceCache();
    resetUserPreferencesPersistQueue();
    document.documentElement.removeAttribute("data-theme");
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("seeds local theme to the server when GET preferences differ", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const serverPreferences = userPreferencesFactory.build({ theme: "system" });

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );
    mockUpdateUserPreferences.mockResolvedValue({
      preferences: userPreferencesFactory.build({ theme: "dark" }),
    });

    renderFeatureHook(() => useUserPreferencesSync(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(mockUpdateUserPreferences).toHaveBeenCalledWith(
        expect.objectContaining({ theme: "dark" }),
      );
    });
  });

  it("hydrates theme and view from GET preferences", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    const serverPreferences = userPreferencesFactory.build({
      theme: "sepia",
      view: { currentView: "list", previousView: "card" },
    });

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );

    const { result } = renderFeatureHook(
      () => {
        useUserPreferencesSync();

        return useAtomValue(viewStateAtom);
      },
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-theme")).toBe("sepia");
    });

    await waitFor(() => {
      expect(result.current.currentView).toBe("list");
    });
  });

  it("keeps pending local filters when the server echoes the in-flight persist", async () => {
    const localFilters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });
    const serverPreferences = userPreferencesFactory.build({
      persistFilters: true,
      filters: persistedFiltersFactory.build({ selectedStyles: ["Rock"] }),
    });

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(localFilters));
    markFiltersPendingPersist(localFilters);

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );

    renderFeatureHook(() => useUserPreferencesSync(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(mockFetchUserPreferences).toHaveBeenCalled();
    });

    expect(
      JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}"),
    ).toEqual(localFilters);
  });

  it("seeds local filters to the server when the server still has defaults", async () => {
    const localFilters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });
    const serverPreferences = userPreferencesFactory.build({
      persistFilters: true,
      filters: persistedFiltersFactory.empty(),
    });

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(localFilters));

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );
    mockUpdateUserPreferences.mockResolvedValue({
      preferences: userPreferencesFactory.build({ filters: localFilters }),
    });

    const { result } = renderFeatureHook(
      () => {
        useUserPreferencesSync();

        return useAtomValue(persistedFiltersAtom);
      },
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.selectedStyles).toEqual(["Rock"]);
    });

    jest.useFakeTimers();

    act(() => {
      jest.advanceTimersByTime(400);
    });

    await waitFor(() => {
      expect(mockUpdateUserPreferences).toHaveBeenCalledWith(
        expect.objectContaining({ filters: localFilters }),
      );
    });
  });

  it("hydrates server filters into storage and pending restore when session is default", async () => {
    const serverFilters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });
    const serverPreferences = userPreferencesFactory.build({
      persistFilters: true,
      filters: serverFilters,
    });

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );

    const { result } = renderFeatureHook(
      () => {
        useUserPreferencesSync();

        return {
          persisted: useAtomValue(persistedFiltersAtom),
          session: useAtomValue(sessionFiltersAtom),
          pending: useAtomValue(pendingFiltersRestoreAtom),
        };
      },
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.persisted.selectedStyles).toEqual(["Rock"]);
    });

    expect(result.current.session.selectedStyles).toEqual([]);
    expect(result.current.pending?.selectedStyles).toEqual(["Rock"]);
    expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
  });

  it("seeds local analytics consent to the server when the server field is unset", async () => {
    localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    const serverPreferences = userPreferencesFactory.defaults();

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );
    mockUpdateUserPreferences.mockResolvedValue({
      preferences: userPreferencesFactory.build({ analyticsConsent: true }),
    });

    renderFeatureHook(() => useUserPreferencesSync(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(mockUpdateUserPreferences).toHaveBeenCalledWith(
        expect.objectContaining({ analyticsConsent: true }),
      );
    });
  });

  it("hydrates analytics consent from server preferences into local storage", async () => {
    const serverPreferences = userPreferencesFactory.build({
      analyticsConsent: false,
    });

    mockApiResponse(
      true,
      mockFetchUserPreferences,
      { preferences: serverPreferences },
      new Error("fail"),
    );

    renderFeatureHook(() => useUserPreferencesSync(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY)).toBe(
        "denied",
      );
    });
  });
});
