import type { createStore } from "jotai/vanilla";

type JotaiStore = ReturnType<typeof createStore>;

import { persistedFiltersAtom } from "src/atoms/filters.atoms";
import { viewStateAtom } from "src/atoms/view.atoms";
import type { PersistedFiltersState } from "src/types/filters.types";
import type { UserPreferences } from "src/types/userPreferences.types";
import type { ViewState } from "src/types/view.types";
import { setFilterPersistenceEnabled } from "src/utils/filterPersistence";
import {
  clearPersistedFilters,
  defaultPersistedFilters,
  hasRestorableFilterSelections,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";
import {
  consumePendingFilterPersist,
  viewStateMatches,
} from "src/utils/userPreferencesSyncState";

interface ApplyUserPreferencesToClientParams {
  store: JotaiStore;
  preferences: UserPreferences;
  setPersistedFilters: (filters: PersistedFiltersState) => void;
  setPendingFiltersRestore: (filters: PersistedFiltersState | null) => void;
  setTheme: (theme: UserPreferences["theme"]) => void;
  setViewState: (view: ViewState) => void;
  syncFromServerPreference: (analyticsConsent: boolean | undefined) => void;
  syncPendingFiltersRestoreOffer: (filters: PersistedFiltersState) => void;
  currentTheme: UserPreferences["theme"];
}

export const applyUserPreferencesToClient = ({
  store,
  preferences,
  setPersistedFilters,
  setPendingFiltersRestore,
  setTheme,
  setViewState,
  syncFromServerPreference,
  syncPendingFiltersRestoreOffer,
  currentTheme,
}: ApplyUserPreferencesToClientParams) => {
  setFilterPersistenceEnabled(preferences.persistFilters);

  const currentView = store.get(viewStateAtom);
  const currentFilters = store.get(persistedFiltersAtom);
  const skipFilterHydrate = consumePendingFilterPersist(preferences.filters);

  if (!preferences.persistFilters) {
    if (!persistedFiltersEqual(currentFilters, defaultPersistedFilters)) {
      clearPersistedFilters();
      setPersistedFilters(defaultPersistedFilters);
    }
    setPendingFiltersRestore(null);
  } else if (
    !(
      skipFilterHydrate ||
      persistedFiltersEqual(currentFilters, preferences.filters)
    )
  ) {
    setPersistedFilters(preferences.filters);
    syncPendingFiltersRestoreOffer(preferences.filters);
  } else if (
    persistedFiltersEqual(currentFilters, preferences.filters) &&
    hasRestorableFilterSelections(preferences.filters)
  ) {
    syncPendingFiltersRestoreOffer(preferences.filters);
  }

  if (currentTheme !== preferences.theme) {
    setTheme(preferences.theme);
  }

  if (!viewStateMatches(currentView, preferences.view)) {
    setViewState(preferences.view);
  }

  syncFromServerPreference(preferences.analyticsConsent);
};
