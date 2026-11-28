import {
  findSortOptionByValue,
  SORTING_SECONDARY_OPTIONS,
} from "src/constants/sorting";
import { SortSecondaryValues } from "src/constants/sortValues";
import type { DiscogsRelease } from "src/types";
import type { PersistedFiltersJson } from "src/types/filters.types";
import { filterReleases } from "src/utils/filterReleases";
import {
  defaultPersistedFilters,
  parseStoredFiltersObject,
} from "src/utils/filtersStorage";
import { sortReleases } from "src/utils/sortReleases";

const YEAR_LIST_INLINE_MAX = 4;

export type CollectionCommandPreviewFact = {
  label: string;
  value: string;
};

const isExclusionPreviewFact = (fact: CollectionCommandPreviewFact): boolean =>
  fact.label.startsWith("Exclude");

export const formatCollectionCommandPreviewTailSegment = (
  fact: CollectionCommandPreviewFact,
): string =>
  isExclusionPreviewFact(fact) ? `excluding ${fact.value}` : fact.value;

export const formatCollectionCommandPreviewTail = (
  facts: CollectionCommandPreviewFact[],
): string => facts.map(formatCollectionCommandPreviewTailSegment).join(" · ");

const summarizeYears = (years: number[]): string => {
  if (years.length === 0) {
    return "";
  }

  const sorted = [...years].sort((first, second) => second - first);
  if (sorted.length > YEAR_LIST_INLINE_MAX) {
    const oldest = sorted[sorted.length - 1];
    const newest = sorted[0];
    return `${oldest}–${newest} · ${sorted.length} years`;
  }

  return sorted.join(", ");
};

export const formatCollectionCommandPreviewDetails = (
  filters: PersistedFiltersJson,
): CollectionCommandPreviewFact[] => {
  const normalized = parseStoredFiltersObject(filters);
  const facts: CollectionCommandPreviewFact[] = [];

  const search = normalized.searchQuery.trim();
  if (search) {
    facts.push({ label: "Search", value: search });
  }

  if (normalized.selectedStyles.length > 0) {
    const tags = normalized.selectedStyles.join(", ");
    facts.push({
      label: normalized.styleOperator === "NONE" ? "Exclude style" : "Style",
      value: tags,
    });
  }

  if (normalized.excludedStyles.length > 0) {
    facts.push({
      label: "Exclude style",
      value: normalized.excludedStyles.join(", "),
    });
  }

  if (normalized.selectedFormats.length > 0) {
    const tags = normalized.selectedFormats.join(", ");
    facts.push({
      label: normalized.formatOperator === "NONE" ? "Exclude format" : "Format",
      value: tags,
    });
  }

  if (normalized.selectedYears.length > 0) {
    const span = summarizeYears(normalized.selectedYears);
    facts.push({
      label: normalized.yearOperator === "NONE" ? "Exclude years" : "Years",
      value: span,
    });
  }

  const sortChanged =
    normalized.selectedSort !== defaultPersistedFilters.selectedSort;
  const secondaryChanged =
    normalized.selectedSortSecondary !== SortSecondaryValues.None &&
    normalized.selectedSortSecondary !==
      defaultPersistedFilters.selectedSortSecondary;

  if (sortChanged || secondaryChanged) {
    const sortLabel =
      findSortOptionByValue(normalized.selectedSort)?.name ??
      normalized.selectedSort;
    const secondaryLabel =
      normalized.selectedSortSecondary !== SortSecondaryValues.None
        ? (SORTING_SECONDARY_OPTIONS.find(
            (option) => option.value === normalized.selectedSortSecondary,
          )?.name ?? normalized.selectedSortSecondary)
        : null;

    facts.push({
      label: "Sort",
      value: secondaryLabel ? `${sortLabel}, ${secondaryLabel}` : sortLabel,
    });
  }

  return facts;
};

export const listCollectionCommandMatchedReleases = ({
  releases,
  filters,
}: {
  releases: readonly DiscogsRelease[];
  filters: PersistedFiltersJson;
}): DiscogsRelease[] => {
  const filtered = filterReleases({
    releases: [...releases],
    ...filters,
  });

  return sortReleases(
    filtered,
    filters.selectedSort,
    filters.selectedSortSecondary,
  );
};

export const previewCollectionCommandFilters = ({
  releases,
  filters,
}: {
  releases: readonly DiscogsRelease[];
  filters: PersistedFiltersJson;
}): {
  matchCount: number;
} => ({
  matchCount: listCollectionCommandMatchedReleases({ releases, filters })
    .length,
});
