import {
  FILTER_ANY_NONE_OPERATOR_OPTIONS,
  FILTER_MATCH_OPERATOR_OPTIONS,
} from "src/constants/filterMatchOperators";
import {
  findSortOptionByValue,
  SORTING_SECONDARY_OPTIONS,
} from "src/constants/sorting";
import { SortSecondaryValues } from "src/constants/sortValues";
import type {
  PersistedFiltersJson,
  StyleOperator,
  YearOperator,
} from "src/types/filters.types";
import {
  defaultPersistedFilters,
  isValidStoredFiltersPatch,
  parseStoredFiltersObject,
  persistedFiltersEqual,
} from "src/utils/filtersStorage";
import { getAppliedFilterCount } from "src/utils/getAppliedFilterCount";

export type FilterView = {
  id: string;
  name: string;
  filters: PersistedFiltersJson;
  updatedAt: string;
};

export const MAX_FILTER_VIEWS = 20;
export const MAX_FILTER_VIEW_NAME_LENGTH = 40;
export const SAVED_COMMAND_VIEW_FALLBACK_NAME = "Saved command";

export const normalizeFilterViewName = (name: string): string => name.trim();

export const isValidFilterViewName = (name: string): boolean => {
  const normalized = normalizeFilterViewName(name);

  return (
    normalized.length > 0 && normalized.length <= MAX_FILTER_VIEW_NAME_LENGTH
  );
};

const isValidFilterView = (value: unknown): value is FilterView => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<FilterView>;

  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    isValidFilterViewName(candidate.name) &&
    isValidStoredFiltersPatch(candidate.filters) &&
    typeof candidate.updatedAt === "string" &&
    candidate.updatedAt.length > 0
  );
};

export const parseFilterViews = (value: unknown): FilterView[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isValidFilterView).slice(0, MAX_FILTER_VIEWS);
};

export const isValidFilterViewsPatch = (
  value: unknown,
): value is FilterView[] => {
  if (!Array.isArray(value)) {
    return false;
  }

  if (value.length > MAX_FILTER_VIEWS) {
    return false;
  }

  return value.every(isValidFilterView);
};

export const createFilterView = (
  name: string,
  filters: PersistedFiltersJson,
): FilterView => ({
  id: crypto.randomUUID(),
  name: normalizeFilterViewName(name),
  filters: parseStoredFiltersObject(filters),
  updatedAt: new Date().toISOString(),
});

export const renameFilterView = (
  views: FilterView[],
  viewId: string,
  name: string,
): FilterView[] | null => {
  const normalizedName = normalizeFilterViewName(name);

  if (!isValidFilterViewName(normalizedName)) {
    return null;
  }

  const viewIndex = views.findIndex((item) => item.id === viewId);

  if (viewIndex === -1) {
    return null;
  }

  const view = views[viewIndex];

  if (!view) {
    return null;
  }

  if (view.name === normalizedName) {
    return views;
  }

  if (filterViewNameExists(views, normalizedName, viewId)) {
    return null;
  }

  const nextViews = [...views];
  nextViews[viewIndex] = {
    ...view,
    name: normalizedName,
    updatedAt: new Date().toISOString(),
  };

  return nextViews;
};

export const findMatchingFilterView = (
  views: FilterView[],
  session: PersistedFiltersJson,
): FilterView | null =>
  views.find((view) => persistedFiltersEqual(view.filters, session)) ?? null;

export const hasSaveableFilterViewFilters = (
  filters: PersistedFiltersJson,
): boolean => getAppliedFilterCount(parseStoredFiltersObject(filters)) > 0;

export const filterViewNameExists = (
  views: FilterView[],
  name: string,
  excludeId?: string,
): boolean => {
  const normalized = normalizeFilterViewName(name).toLowerCase();

  return views.some(
    (view) =>
      view.id !== excludeId && view.name.trim().toLowerCase() === normalized,
  );
};

export const ensureUniqueFilterViewName = (
  baseName: string,
  views: FilterView[],
): string => {
  const trimmed = normalizeFilterViewName(baseName);
  const base =
    trimmed.length > 0 && trimmed.length <= MAX_FILTER_VIEW_NAME_LENGTH
      ? trimmed
      : SAVED_COMMAND_VIEW_FALLBACK_NAME;

  if (!filterViewNameExists(views, base)) {
    return base;
  }

  for (let index = 2; index < 100; index += 1) {
    const suffix = ` (${index})`;
    const maxBaseLength = MAX_FILTER_VIEW_NAME_LENGTH - suffix.length;
    const candidate = `${base.slice(0, maxBaseLength)}${suffix}`;

    if (!filterViewNameExists(views, candidate)) {
      return candidate;
    }
  }

  return base;
};

const getOperatorLabel = (
  operator: StyleOperator | YearOperator,
  options: ReadonlyArray<{ value: string; label: string }>,
): string | null =>
  options.find((option) => option.value === operator)?.label ?? null;

const formatOperatorSuffix = (
  operator: StyleOperator | YearOperator,
  selectedCount: number,
  options: ReadonlyArray<{ value: string; label: string }>,
): string => {
  if (selectedCount === 0) {
    return "";
  }

  if (operator === "OR" && selectedCount === 1) {
    return "";
  }

  const label = getOperatorLabel(operator, options);

  return label ? ` (${label})` : "";
};

export const formatFilterViewSummary = (
  filters: PersistedFiltersJson,
): string => {
  const normalized = parseStoredFiltersObject(filters);
  const parts: string[] = [];

  const searchQuery = normalized.searchQuery.trim();
  if (searchQuery) {
    parts.push(`Search: "${searchQuery}"`);
  }

  if (normalized.selectedStyles.length > 0) {
    parts.push(
      `Genre & style: ${normalized.selectedStyles.join(", ")}${formatOperatorSuffix(normalized.styleOperator, normalized.selectedStyles.length, FILTER_MATCH_OPERATOR_OPTIONS)}`,
    );
  }

  if (normalized.excludedStyles.length > 0) {
    parts.push(`Not style: ${normalized.excludedStyles.join(", ")}`);
  }

  if (normalized.excludedFormats.length > 0) {
    parts.push(`Not format: ${normalized.excludedFormats.join(", ")}`);
  }

  if (normalized.selectedFormats.length > 0) {
    parts.push(
      `Format: ${normalized.selectedFormats.join(", ")}${formatOperatorSuffix(normalized.formatOperator, normalized.selectedFormats.length, FILTER_MATCH_OPERATOR_OPTIONS)}`,
    );
  }

  if (normalized.excludedYears.length > 0) {
    parts.push(`Not year: ${normalized.excludedYears.join(", ")}`);
  }

  if (normalized.selectedYears.length > 0) {
    parts.push(
      `Year: ${normalized.selectedYears.join(", ")}${formatOperatorSuffix(normalized.yearOperator, normalized.selectedYears.length, FILTER_ANY_NONE_OPERATOR_OPTIONS)}`,
    );
  }

  if (normalized.selectedSort !== defaultPersistedFilters.selectedSort) {
    const sortLabel =
      findSortOptionByValue(normalized.selectedSort)?.name ??
      normalized.selectedSort;
    parts.push(`Sort: ${sortLabel}`);
  }

  if (
    normalized.selectedSortSecondary !== SortSecondaryValues.None &&
    normalized.selectedSortSecondary !==
      defaultPersistedFilters.selectedSortSecondary
  ) {
    const thenByLabel =
      SORTING_SECONDARY_OPTIONS.find(
        (option) => option.value === normalized.selectedSortSecondary,
      )?.name ?? normalized.selectedSortSecondary;
    parts.push(`Then by: ${thenByLabel}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Default filters";
};
