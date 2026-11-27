import type { DuplicateGroup } from "src/types/dashboard.types";
import type { PersistedFiltersState } from "src/types/filters.types";
import { defaultPersistedFilters } from "src/utils/filtersStorage";

export type DashboardDrilldownKind =
  | "genreStyle"
  | "decade"
  | "format"
  | "search";

export type DashboardDrilldownTarget = {
  kind: DashboardDrilldownKind;
  label: string;
};

const DECADE_LABEL_PATTERN = /^(\d{4})s$/;

export const listYearsForDecadeLabel = (label: string): number[] => {
  const match = DECADE_LABEL_PATTERN.exec(label.trim());
  if (!match) {
    return [];
  }

  const decadeStart = Number(match[1]);
  return Array.from({ length: 10 }, (_, index) => decadeStart + index);
};

export const buildDashboardDrilldownSessionFilters = (
  target: DashboardDrilldownTarget,
): PersistedFiltersState => {
  const base = { ...defaultPersistedFilters };

  switch (target.kind) {
    case "genreStyle":
      return {
        ...base,
        selectedStyles: [target.label],
      };
    case "decade":
      return {
        ...base,
        selectedYears: listYearsForDecadeLabel(target.label),
      };
    case "format":
      return {
        ...base,
        selectedFormats: [target.label],
      };
    case "search":
      return {
        ...base,
        searchQuery: target.label,
      };
    default: {
      const _exhaustive: never = target.kind;
      return _exhaustive;
    }
  }
};

export const buildDuplicateGroupDrilldownTarget = (
  group: DuplicateGroup,
): DashboardDrilldownTarget | null => {
  const primary = group.releases[0];
  const title = primary?.basic_information.title?.trim();
  if (!title) {
    return null;
  }

  return {
    kind: "search",
    label: title,
  };
};
