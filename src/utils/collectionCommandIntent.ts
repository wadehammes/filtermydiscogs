import type { SortValues } from "src/constants/sortValues";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import type {
  FacetOptions,
  PersistedFiltersJson,
} from "src/types/filters.types";
import { normalizeThenBySortSelection } from "src/utils/collectionSortOptions";
import { parseStoredFiltersObject } from "src/utils/filtersStorage";

const intersectTags = (
  selected: readonly string[],
  available: readonly string[],
): string[] => {
  if (selected.length === 0 || available.length === 0) {
    return [];
  }

  const availableLower = new Map(
    available.map((tag) => [tag.toLowerCase(), tag]),
  );

  const result: string[] = [];
  for (const tag of selected) {
    const match = availableLower.get(tag.trim().toLowerCase());
    if (match) {
      result.push(match);
    }
  }

  return result;
};

const intersectYears = (
  selected: readonly number[],
  available: readonly number[],
): number[] => {
  if (selected.length === 0) {
    return [];
  }

  const availableSet = new Set(available);
  return selected.filter((year) => availableSet.has(year));
};

export const expandYearsFromInclusiveBounds = (
  availableYears: readonly number[],
  yearStartInclusive: number,
  yearEndExclusive: number,
): number[] => {
  const start = yearStartInclusive > 0 ? yearStartInclusive : null;
  const end = yearEndExclusive > 0 ? yearEndExclusive : null;

  if (start === null && end === null) {
    return [];
  }

  return availableYears.filter((year) => {
    if (start !== null && year < start) {
      return false;
    }

    if (end !== null && year >= end) {
      return false;
    }

    return true;
  });
};

export type SanitizeCollectionCommandIntentResult = {
  filters: PersistedFiltersJson;
  droppedStyles: string[];
  droppedFormats: string[];
  droppedYears: number[];
};

export const collectionCommandIntentToFilters = (
  intent: CollectionCommandIntent,
): PersistedFiltersJson => {
  const selectedSort = intent.selectedSort as SortValues;
  const selectedSortSecondary = normalizeThenBySortSelection(
    selectedSort,
    intent.selectedSortSecondary,
  );

  return parseStoredFiltersObject({
    searchQuery: intent.searchQuery ?? "",
    selectedStyles: intent.selectedStyles ?? [],
    excludedStyles: intent.excludedStyles ?? [],
    selectedYears: intent.selectedYears ?? [],
    selectedFormats: intent.selectedFormats ?? [],
    styleOperator: intent.styleOperator,
    formatOperator: intent.formatOperator,
    yearOperator: intent.yearOperator,
    selectedSort,
    selectedSortSecondary,
  });
};

export const sanitizeCollectionCommandIntent = (
  intent: CollectionCommandIntent,
  facetOptions: FacetOptions,
): SanitizeCollectionCommandIntentResult => {
  const selectedStyles = intent.selectedStyles ?? [];
  const selectedFormats = intent.selectedFormats ?? [];
  const selectedYears = intent.selectedYears ?? [];

  const keptStyles = intersectTags(
    selectedStyles,
    facetOptions.availableStyles,
  );
  const excludedStyles = intent.excludedStyles ?? [];
  const keptExcludedStyles = intersectTags(
    excludedStyles,
    facetOptions.availableStyles,
  );
  const keptFormats = intersectTags(
    selectedFormats,
    facetOptions.availableFormats,
  );
  const boundYears = expandYearsFromInclusiveBounds(
    facetOptions.availableYears,
    intent.yearStartInclusive ?? 0,
    intent.yearEndExclusive ?? 0,
  );
  const yearBoundsActive =
    (intent.yearStartInclusive ?? 0) > 0 || (intent.yearEndExclusive ?? 0) > 0;
  const keptYears =
    boundYears.length > 0
      ? boundYears
      : intersectYears(selectedYears, facetOptions.availableYears);

  const droppedStyles = selectedStyles.filter(
    (tag) => !keptStyles.includes(tag),
  );
  const droppedFormats = selectedFormats.filter(
    (tag) => !keptFormats.includes(tag),
  );
  const droppedYears = selectedYears.filter(
    (year) => !keptYears.includes(year),
  );

  const filters = collectionCommandIntentToFilters({
    ...intent,
    selectedStyles: keptStyles,
    excludedStyles: keptExcludedStyles,
    selectedFormats: keptFormats,
    selectedYears: keptYears,
    yearOperator:
      yearBoundsActive && keptYears.length > 0 ? "OR" : intent.yearOperator,
  });

  return {
    filters,
    droppedStyles,
    droppedFormats,
    droppedYears,
  };
};
