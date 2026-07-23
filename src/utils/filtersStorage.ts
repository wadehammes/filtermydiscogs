export const FILTERS_STORAGE_KEY = "filtermydiscogs_filters";

/** Must stay aligned with `SortValues` in `src/atoms/filters.atoms.ts`. */
const VALID_SORT_VALUES = new Set([
  "AZLabel",
  "ZALabel",
  "AZArtist",
  "ZAArtist",
  "AZTitle",
  "ZATitle",
  "DateAddedNew",
  "DateAddedOld",
  "RatingHigh",
  "RatingLow",
  "AlbumYearNew",
  "AlbumYearOld",
]);

const VALID_STYLE_OPERATORS = new Set(["AND", "OR", "NONE"]);

export interface PersistedFiltersState {
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  selectedSort: string;
  styleOperator: string;
  searchQuery: string;
}

export const defaultPersistedFilters: PersistedFiltersState = {
  selectedStyles: [],
  selectedYears: [],
  selectedFormats: [],
  selectedSort: "DateAddedNew",
  styleOperator: "OR",
  searchQuery: "",
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isNumberArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.every((item) => typeof item === "number");

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
    VALID_STYLE_OPERATORS.has(state.styleOperator) &&
    typeof state.searchQuery === "string"
  );
};

export const parsePersistedFilters = (
  value: string | null,
): PersistedFiltersState => {
  if (!value) {
    return defaultPersistedFilters;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (isValidPersistedFilters(parsed)) {
      return parsed;
    }
  } catch {
    // Corrupt storage falls back to defaults below.
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
