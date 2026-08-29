import { SortValues, VALID_SORT_VALUES } from "src/constants/sortValues";
import { FILTERS_STORAGE_KEY } from "src/constants/storageKeys";
import type { PersistedFiltersState } from "src/types/filters.types";
import {
  type StyleOperator,
  VALID_STYLE_OPERATORS,
  VALID_YEAR_OPERATORS,
  type YearOperator,
} from "src/types/filters.types";
import { getAppliedFilterCount } from "src/utils/getAppliedFilterCount";

export type { PersistedFiltersState } from "src/types/filters.types";
export { FILTERS_STORAGE_KEY };

export const defaultPersistedFilters: PersistedFiltersState = {
  selectedStyles: [],
  selectedYears: [],
  selectedFormats: [],
  selectedSort: SortValues.DateAddedNew,
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  searchQuery: "",
};

export const inactiveFilterSelectionDefaults = {
  selectedStyles: defaultPersistedFilters.selectedStyles,
  selectedYears: defaultPersistedFilters.selectedYears,
  selectedFormats: defaultPersistedFilters.selectedFormats,
  searchQuery: defaultPersistedFilters.searchQuery,
  selectedSort: defaultPersistedFilters.selectedSort,
  styleOperator: defaultPersistedFilters.styleOperator,
  formatOperator: defaultPersistedFilters.formatOperator,
  yearOperator: defaultPersistedFilters.yearOperator,
} as const;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number");

const migratePersistedSort = (sort: string): SortValues => {
  if (sort === "CommunityRatingHigh" || sort === "CommunityRatingLow") {
    return defaultPersistedFilters.selectedSort;
  }

  if (VALID_SORT_VALUES.has(sort)) {
    return sort as SortValues;
  }

  return defaultPersistedFilters.selectedSort;
};

const isValidPersistedFilters = (
  value: unknown,
): value is PersistedFiltersState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<PersistedFiltersState>;

  return (
    isStringArray(state.selectedStyles) &&
    isNumberArray(state.selectedYears) &&
    isStringArray(state.selectedFormats) &&
    typeof state.selectedSort === "string" &&
    VALID_SORT_VALUES.has(state.selectedSort) &&
    typeof state.styleOperator === "string" &&
    VALID_STYLE_OPERATORS.has(state.styleOperator as StyleOperator) &&
    typeof state.formatOperator === "string" &&
    VALID_STYLE_OPERATORS.has(state.formatOperator as StyleOperator) &&
    typeof state.yearOperator === "string" &&
    VALID_YEAR_OPERATORS.has(state.yearOperator as YearOperator) &&
    typeof state.searchQuery === "string"
  );
};

const parsePersistedFiltersValue = (
  parsed: unknown,
): PersistedFiltersState | null => {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const candidate = {
    ...defaultPersistedFilters,
    ...(parsed as PersistedFiltersState),
  };

  if ("selectedSort" in candidate) {
    candidate.selectedSort = migratePersistedSort(candidate.selectedSort);
  }

  if (isValidPersistedFilters(candidate)) {
    return candidate;
  }

  return null;
};

const normalizePersistedFilters = (value: unknown): PersistedFiltersState =>
  parsePersistedFiltersValue(value) ?? defaultPersistedFilters;

export const parsePersistedFilters = (
  value: string | null,
): PersistedFiltersState => {
  if (!value) {
    return defaultPersistedFilters;
  }

  try {
    const parsed = parsePersistedFiltersValue(JSON.parse(value));
    if (parsed) {
      return parsed;
    }
  } catch {
    if (typeof window !== "undefined") {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    }
    return defaultPersistedFilters;
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(FILTERS_STORAGE_KEY);
  }

  return defaultPersistedFilters;
};

export const clearPersistedFilters = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(FILTERS_STORAGE_KEY);
};

export const parseStoredFiltersObject = (
  value: unknown,
): PersistedFiltersState => normalizePersistedFilters(value);

export const isValidStoredFiltersPatch = (
  value: unknown,
): value is PersistedFiltersState => parsePersistedFiltersValue(value) !== null;

const canonicalizePersistedFiltersForCompare = (
  filters: PersistedFiltersState,
): PersistedFiltersState => {
  const normalized = parseStoredFiltersObject(filters);

  return {
    selectedStyles: [...normalized.selectedStyles].sort(),
    selectedYears: [...normalized.selectedYears].sort(
      (left, right) => left - right,
    ),
    selectedFormats: [...normalized.selectedFormats].sort(),
    selectedSort: normalized.selectedSort,
    styleOperator: normalized.styleOperator,
    formatOperator: normalized.formatOperator,
    yearOperator: normalized.yearOperator,
    searchQuery: normalized.searchQuery,
  };
};

export const persistedFiltersEqual = (
  left: PersistedFiltersState,
  right: PersistedFiltersState,
): boolean =>
  JSON.stringify(canonicalizePersistedFiltersForCompare(left)) ===
  JSON.stringify(canonicalizePersistedFiltersForCompare(right));

export const hasRestorableFilterSelections = (
  filters: PersistedFiltersState,
): boolean => {
  if (persistedFiltersEqual(filters, defaultPersistedFilters)) {
    return false;
  }

  return getAppliedFilterCount(filters) > 0;
};
