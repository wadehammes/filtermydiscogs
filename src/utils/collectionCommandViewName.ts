import { CRATE_NAME_MAX_LENGTH } from "src/constants/crate";
import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import type { PersistedFiltersJson } from "src/types/filters.types";
import {
  MAX_FILTER_VIEW_NAME_LENGTH,
  normalizeFilterViewName,
  SAVED_COMMAND_VIEW_FALLBACK_NAME,
} from "src/utils/filterViews";

const truncateViewName = (name: string): string => {
  if (name.length <= MAX_FILTER_VIEW_NAME_LENGTH) {
    return name;
  }

  return `${name.slice(0, MAX_FILTER_VIEW_NAME_LENGTH - 1)}…`;
};

const joinTagLabels = (tags: readonly string[]): string =>
  [...tags]
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    )
    .join("/");

const formatYearLabel = ({
  filters,
  intent,
}: {
  filters: PersistedFiltersJson;
  intent?: CollectionCommandIntent;
}): string | null => {
  const selectedYears = filters.selectedYears ?? [];
  if (selectedYears.length === 1) {
    return String(selectedYears[0]);
  }

  if (selectedYears.length > 1) {
    const sorted = [...selectedYears].sort((left, right) => left - right);
    const isContiguous = sorted.every((year, index) => {
      if (index === 0) {
        return true;
      }

      const prior = sorted[index - 1];
      return prior !== undefined && year === prior + 1;
    });

    if (isContiguous && sorted.length > 1) {
      return `${sorted[0]}–${sorted[sorted.length - 1]}`;
    }

    if (sorted.length <= 3) {
      return sorted.join("/");
    }

    return `${sorted[0]}–${sorted[sorted.length - 1]}`;
  }

  if (!intent) {
    return null;
  }

  const start = intent.yearStartInclusive ?? 0;
  const end = intent.yearEndExclusive ?? 0;

  if (start > 0 && end > 0) {
    if (end === start + 1) {
      return String(start);
    }

    return `${start}–${end - 1}`;
  }

  if (start > 0 && end === 0) {
    return `${start}+`;
  }

  if (start === 0 && end > 0) {
    return `Before ${end}`;
  }

  return null;
};

export const buildCollectionCommandViewNameFromFilters = ({
  filters,
  intent,
}: {
  filters: PersistedFiltersJson;
  intent?: CollectionCommandIntent;
}): string | null => {
  const segments: string[] = [];

  const yearLabel = formatYearLabel({
    filters,
    ...(intent ? { intent } : {}),
  });
  if (yearLabel) {
    segments.push(yearLabel);
  }

  const styles = joinTagLabels(filters.selectedStyles ?? []);
  if (styles.length > 0) {
    segments.push(styles);
  }

  const excludedStyles = joinTagLabels(filters.excludedStyles ?? []);
  if (excludedStyles.length > 0) {
    segments.push(`not ${excludedStyles}`);
  }

  const formats = joinTagLabels(filters.selectedFormats ?? []);
  if (formats.length > 0) {
    segments.push(formats);
  }

  const searchQuery = filters.searchQuery?.trim() ?? "";
  if (searchQuery.length > 0 && segments.length === 0) {
    segments.push(searchQuery);
  }

  if (segments.length === 0) {
    return null;
  }

  return truncateViewName(segments.join(" "));
};

export const buildCollectionCommandViewName = ({
  prompt,
  suggestedViewName,
  filters,
  intent,
}: {
  prompt: string;
  suggestedViewName?: string;
  filters?: PersistedFiltersJson;
  intent?: CollectionCommandIntent;
}): string => {
  const suggested = suggestedViewName?.trim();
  if (suggested) {
    return truncateViewName(suggested);
  }

  if (filters) {
    const fromFilters = buildCollectionCommandViewNameFromFilters({
      filters,
      ...(intent ? { intent } : {}),
    });
    if (fromFilters) {
      return fromFilters;
    }
  }

  const normalizedPrompt = normalizeFilterViewName(prompt.replace(/\s+/g, " "));

  if (normalizedPrompt.length === 0) {
    return SAVED_COMMAND_VIEW_FALLBACK_NAME;
  }

  return truncateViewName(normalizedPrompt);
};

const truncateCrateName = (name: string): string => {
  if (name.length <= CRATE_NAME_MAX_LENGTH) {
    return name;
  }

  return `${name.slice(0, CRATE_NAME_MAX_LENGTH - 1)}…`;
};

export const buildCollectionCommandCrateName = (
  params: Parameters<typeof buildCollectionCommandViewName>[0],
): string => {
  const suggested = params.suggestedViewName?.trim();
  if (suggested) {
    return truncateCrateName(suggested);
  }

  return truncateCrateName(buildCollectionCommandViewName(params));
};
