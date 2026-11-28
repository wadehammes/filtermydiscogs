import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { createStore } from "jotai/vanilla";
import { persistedFiltersAtom } from "src/atoms/filters.atoms";
import { viewStateAtom } from "src/atoms/view.atoms";
import {
  persistedFiltersFactory,
  userPreferencesFactory,
} from "src/tests/factories/UserPreferences.factory";
import { persistedFiltersEqual } from "src/utils/filtersStorage";
import { applyUserPreferencesToClient } from "src/utils/userPreferencesClientApply";
import { markFiltersPendingPersist } from "src/utils/userPreferencesSyncState";

describe("applyUserPreferencesToClient", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("applies theme and view state when server preferences differ from client", () => {
    const store = createStore();
    store.set(viewStateAtom, { currentView: "card", previousView: "list" });

    const setTheme = jest.fn();
    const setViewState = jest.fn();
    const preferences = userPreferencesFactory.build({
      theme: "dark",
      view: { currentView: "list", previousView: "card" },
    });

    applyUserPreferencesToClient({
      store,
      preferences,
      setPersistedFilters: jest.fn(),
      setPendingFiltersRestore: jest.fn(),
      setTheme,
      setViewState,
      syncFromServerPreference: jest.fn(),
      syncPendingFiltersRestoreOffer: jest.fn(),
      currentTheme: "system",
    });

    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(setViewState).toHaveBeenCalledWith(preferences.view);
  });

  it("applies square corners when enabled on server preferences", () => {
    const store = createStore();
    const preferences = userPreferencesFactory.build({ squareCorners: true });

    applyUserPreferencesToClient({
      store,
      preferences,
      setPersistedFilters: jest.fn(),
      setPendingFiltersRestore: jest.fn(),
      setTheme: jest.fn(),
      setViewState: jest.fn(),
      syncFromServerPreference: jest.fn(),
      syncPendingFiltersRestoreOffer: jest.fn(),
      currentTheme: preferences.theme,
    });

    expect(document.documentElement.getAttribute("data-ui-radius")).toBe(
      "square",
    );
  });

  it("clears local filters when persistFilters is disabled on the server", () => {
    const store = createStore();
    const customFilters = persistedFiltersFactory.withDefaults({
      searchQuery: "miles",
    });
    store.set(persistedFiltersAtom, customFilters);

    const setPersistedFilters = jest.fn();
    const setPendingFiltersRestore = jest.fn();
    const preferences = userPreferencesFactory.build({
      persistFilters: false,
      filters: persistedFiltersFactory.empty(),
    });

    applyUserPreferencesToClient({
      store,
      preferences,
      setPersistedFilters,
      setPendingFiltersRestore,
      setTheme: jest.fn(),
      setViewState: jest.fn(),
      syncFromServerPreference: jest.fn(),
      syncPendingFiltersRestoreOffer: jest.fn(),
      currentTheme: preferences.theme,
    });

    expect(setPersistedFilters).toHaveBeenCalledWith(
      persistedFiltersFactory.empty(),
    );
    expect(setPendingFiltersRestore).toHaveBeenCalledWith(null);
    expect(
      persistedFiltersEqual(
        store.get(persistedFiltersAtom),
        persistedFiltersFactory.empty(),
      ),
    ).toBe(false);
  });

  it("skips filter hydration when a pending local persist matches server filters", () => {
    const store = createStore();
    const filters = persistedFiltersFactory.withDefaults({
      searchQuery: "coltrane",
    });
    store.set(persistedFiltersAtom, persistedFiltersFactory.empty());

    markFiltersPendingPersist(filters);

    const setPersistedFilters = jest.fn();
    const syncPendingFiltersRestoreOffer = jest.fn();
    const preferences = userPreferencesFactory.build({
      persistFilters: true,
      filters,
    });

    applyUserPreferencesToClient({
      store,
      preferences,
      setPersistedFilters,
      setPendingFiltersRestore: jest.fn(),
      setTheme: jest.fn(),
      setViewState: jest.fn(),
      syncFromServerPreference: jest.fn(),
      syncPendingFiltersRestoreOffer,
      currentTheme: preferences.theme,
    });

    expect(setPersistedFilters).not.toHaveBeenCalled();
    expect(syncPendingFiltersRestoreOffer).not.toHaveBeenCalled();
  });
});
