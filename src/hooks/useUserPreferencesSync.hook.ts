"use client";

import { useSetAtom, useStore } from "jotai";
import { useEffect, useRef } from "react";
import {
  pendingFiltersRestoreAtom,
  pendingFiltersRestoreDismissedAtom,
  persistedFiltersAtom,
  sessionFiltersAtom,
} from "src/atoms/filters.atoms";
import { viewStateAtom } from "src/atoms/view.atoms";
import {
  FILTERS_STORAGE_KEY,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";
import { useAuth } from "src/context/auth.context";
import { useTheme } from "src/context/theme.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import type { PersistedFiltersState } from "src/types/filters.types";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";
import { defaultViewState, parseViewStateJson } from "src/types/view.types";
import {
  analyticsConsentChoiceToBoolean,
  readAnalyticsConsentChoice,
} from "src/utils/analyticsConsentStorage";
import { setFilterPersistenceEnabled } from "src/utils/filterPersistence";
import {
  clearPersistedFilters,
  defaultPersistedFilters,
  hasRestorableFilterSelections,
  parsePersistedFilters,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";
import {
  consumePendingFilterPersist,
  viewStateMatches,
} from "src/utils/userPreferencesSyncState";

export const useUserPreferencesSync = () => {
  const { state: authState } = useAuth();
  const { userId, isAuthenticated, isCheckingAuth } = authState;
  const { theme, setTheme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const store = useStore();
  const setViewState = useSetAtom(viewStateAtom);
  const setPersistedFilters = useSetAtom(persistedFiltersAtom);
  const setPendingFiltersRestore = useSetAtom(pendingFiltersRestoreAtom);
  const appliedPreferencesKeyRef = useRef<string | null>(null);
  const hasSeededLocalPreferencesRef = useRef(false);

  const syncPendingFiltersRestoreOffer = (filters: PersistedFiltersState) => {
    if (store.get(pendingFiltersRestoreDismissedAtom)) {
      return;
    }

    const session = store.get(sessionFiltersAtom);

    if (!persistedFiltersEqual(session, defaultPersistedFilters)) {
      return;
    }

    if (hasRestorableFilterSelections(filters)) {
      setPendingFiltersRestore({ ...filters });
      return;
    }

    setPendingFiltersRestore(null);
  };

  const { data: preferences } = useUserPreferencesQuery({
    userId,
    enabled: isAuthenticated && !isCheckingAuth,
  });
  const { persistPreferences } = usePersistUserPreferences();
  const { syncFromServerPreference } = useAnalyticsConsent();

  useEffect(() => {
    if (!isAuthenticated) {
      setFilterPersistenceEnabled(true);
      appliedPreferencesKeyRef.current = null;
      hasSeededLocalPreferencesRef.current = false;

      if (!isCheckingAuth && themeRef.current !== "system") {
        setTheme("system");
      }

      return;
    }

    if (!preferences) {
      return;
    }

    if (!hasSeededLocalPreferencesRef.current) {
      const localTheme = themeRef.current;
      const localView = parseViewStateJson(
        typeof window === "undefined"
          ? null
          : localStorage.getItem(VIEW_STATE_STORAGE_KEY),
      );
      const localFilters = parsePersistedFilters(
        typeof window === "undefined"
          ? null
          : localStorage.getItem(FILTERS_STORAGE_KEY),
      );
      const seedPatch: UserPreferencesPatch = {};

      if (
        localTheme !== preferences.theme &&
        preferences.theme === "system" &&
        localTheme !== "system"
      ) {
        seedPatch.theme = localTheme;
      }

      if (
        !viewStateMatches(localView, preferences.view) &&
        viewStateMatches(preferences.view, defaultViewState) &&
        !viewStateMatches(localView, defaultViewState)
      ) {
        seedPatch.view = localView;
      }

      const serverFiltersAreDefault = persistedFiltersEqual(
        preferences.filters,
        defaultPersistedFilters,
      );
      const localFiltersAreDefault = persistedFiltersEqual(
        localFilters,
        defaultPersistedFilters,
      );

      if (
        preferences.persistFilters &&
        !persistedFiltersEqual(localFilters, preferences.filters) &&
        serverFiltersAreDefault &&
        !localFiltersAreDefault
      ) {
        seedPatch.filters = localFilters;
      }

      const localAnalyticsChoice = readAnalyticsConsentChoice();
      if (
        localAnalyticsChoice !== null &&
        preferences.analyticsConsent === undefined
      ) {
        seedPatch.analyticsConsent =
          analyticsConsentChoiceToBoolean(localAnalyticsChoice);
      }

      hasSeededLocalPreferencesRef.current = true;

      if (Object.keys(seedPatch).length > 0) {
        persistPreferences(seedPatch);
        return;
      }
    }

    const preferencesKey = JSON.stringify(preferences);
    if (appliedPreferencesKeyRef.current === preferencesKey) {
      return;
    }

    appliedPreferencesKeyRef.current = preferencesKey;

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

    if (themeRef.current !== preferences.theme) {
      setTheme(preferences.theme);
    }

    if (!viewStateMatches(currentView, preferences.view)) {
      setViewState(preferences.view);
    }

    syncFromServerPreference(preferences.analyticsConsent);
  }, [
    isAuthenticated,
    isCheckingAuth,
    preferences,
    persistPreferences,
    setPersistedFilters,
    setPendingFiltersRestore,
    setTheme,
    setViewState,
    store,
    syncFromServerPreference,
  ]);
};
