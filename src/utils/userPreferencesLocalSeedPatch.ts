import {
  FILTERS_STORAGE_KEY,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import type {
  UserPreferences,
  UserPreferencesPatch,
} from "src/types/userPreferences.types";
import { defaultViewState, parseViewStateJson } from "src/types/view.types";
import {
  analyticsConsentChoiceToBoolean,
  readAnalyticsConsentChoice,
} from "src/utils/analyticsConsentStorage";
import {
  defaultPersistedFilters,
  parsePersistedFilters,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";
import { viewStateMatches } from "src/utils/userPreferencesSyncState";

interface BuildLocalPreferencesSeedPatchParams {
  preferences: UserPreferences;
  localTheme: "light" | "dark" | "system";
}

export const buildLocalPreferencesSeedPatch = ({
  preferences,
  localTheme,
}: BuildLocalPreferencesSeedPatchParams): UserPreferencesPatch => {
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

  return seedPatch;
};
