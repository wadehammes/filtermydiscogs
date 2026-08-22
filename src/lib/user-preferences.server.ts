import type { Prisma } from "@prisma/client";
import {
  type StoredTheme,
  type StoredViewState,
  USER_PREFERENCES_VERSION,
  type UserPreferences,
  type UserPreferencesJson,
  type UserPreferencesPatch,
} from "src/types/userPreferences.types";
import {
  defaultViewState,
  isValidViewState,
  type ViewState,
} from "src/types/view.types";
import {
  defaultPersistedFilters,
  parseStoredFiltersObject,
} from "src/utils/filtersStorage";
import { isValidStoredTheme, parseStoredTheme } from "src/utils/storedTheme";

export const defaultViewPreference: StoredViewState = defaultViewState;

export const defaultUserPreferences = (): UserPreferences => ({
  version: USER_PREFERENCES_VERSION,
  persistFilters: true,
  theme: "system",
  view: defaultViewPreference,
  filters: defaultPersistedFilters,
});

const isJsonObject = (value: Prisma.JsonValue): value is Prisma.JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export { isValidStoredTheme };

export const isValidStoredViewPatch = (
  value: Prisma.JsonValue | StoredViewState,
): value is StoredViewState =>
  isJsonObject(value) && isValidViewState(value as ViewState);

const parseViewPreference = (value: Prisma.JsonValue): StoredViewState => {
  if (!isValidStoredViewPatch(value)) {
    return defaultViewPreference;
  }

  return value;
};

const parsePersistFiltersField = (
  value: Prisma.JsonValue | undefined,
  fallback: boolean,
): boolean => (typeof value === "boolean" ? value : fallback);

const parseThemeField = (
  value: Prisma.JsonValue | undefined,
  fallback: StoredTheme,
): StoredTheme => {
  if (value === undefined) {
    return fallback;
  }

  return parseStoredTheme(value, fallback);
};

export const parseUserPreferences = (
  storedPreferences: Prisma.JsonValue | UserPreferencesJson,
): UserPreferences => {
  if (!isJsonObject(storedPreferences)) {
    return defaultUserPreferences();
  }

  const defaults = defaultUserPreferences();

  return {
    version: USER_PREFERENCES_VERSION,
    persistFilters: parsePersistFiltersField(
      storedPreferences.persistFilters,
      defaults.persistFilters,
    ),
    theme: parseThemeField(storedPreferences.theme, defaults.theme),
    view: parseViewPreference(storedPreferences.view ?? null),
    filters: parseStoredFiltersObject(storedPreferences.filters),
    ...(typeof storedPreferences.analyticsConsent === "boolean"
      ? { analyticsConsent: storedPreferences.analyticsConsent }
      : {}),
  };
};

export const mergeUserPreferences = (
  current: UserPreferences,
  patch: UserPreferencesPatch,
): UserPreferences => ({
  ...current,
  ...patch,
  version: USER_PREFERENCES_VERSION,
  view: patch.view ? parseViewPreference(patch.view) : current.view,
  filters: patch.filters
    ? parseStoredFiltersObject(patch.filters)
    : current.filters,
});
