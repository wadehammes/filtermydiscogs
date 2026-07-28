import type { PersistedFiltersJson } from "src/types/filters.types";
import type { ViewMode } from "src/types/view.types";

export const USER_PREFERENCES_VERSION = 1;

export type StoredTheme = "light" | "dark";

export type StoredViewState = {
  currentView: ViewMode;
  previousView: ViewMode;
};

export type UserPreferencesJson = {
  version: typeof USER_PREFERENCES_VERSION;
  persistFilters: boolean;
  theme: StoredTheme;
  view: StoredViewState;
  filters: PersistedFiltersJson;
};

export type UserPreferences = UserPreferencesJson;

export type UserPreferencesPatch = Partial<
  Pick<UserPreferences, "persistFilters" | "theme" | "view" | "filters">
>;
