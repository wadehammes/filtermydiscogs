"use client";

import { useSetAtom, useStore } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import {
  pendingFiltersRestoreAtom,
  pendingFiltersRestoreDismissedAtom,
  persistedFiltersAtom,
  sessionFiltersAtom,
} from "src/atoms/filters.atoms";
import { viewStateAtom } from "src/atoms/view.atoms";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";
import { useAuth } from "src/context/auth.context";
import { useTheme } from "src/context/theme.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import type { PersistedFiltersState } from "src/types/filters.types";
import { setFilterPersistenceEnabled } from "src/utils/filterPersistence";
import {
  defaultPersistedFilters,
  hasRestorableFilterSelections,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";
import { applyUserPreferencesToClient } from "src/utils/userPreferencesClientApply";
import { buildLocalPreferencesSeedPatch } from "src/utils/userPreferencesLocalSeedPatch";

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

  const syncPendingFiltersRestoreOffer = useCallback(
    (filters: PersistedFiltersState) => {
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
    },
    [setPendingFiltersRestore, store],
  );

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
      const seedPatch = buildLocalPreferencesSeedPatch({
        preferences,
        localTheme: themeRef.current,
      });

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

    applyUserPreferencesToClient({
      store,
      preferences,
      setPersistedFilters,
      setPendingFiltersRestore,
      setTheme,
      setViewState,
      syncFromServerPreference,
      syncPendingFiltersRestoreOffer,
      currentTheme: themeRef.current,
    });
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
    syncPendingFiltersRestoreOffer,
  ]);
};
