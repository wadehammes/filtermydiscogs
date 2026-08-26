import type { DiscogsRelease } from "src/types";
import type { ReleaseFilterCriteria } from "src/types/filters.types";
import { computeFilterDerivedState } from "src/utils/computeFilterDerivedState";

export const filterReleases = ({
  releases,
  searchQuery = "",
  styleOperator = "OR",
  formatOperator = "OR",
  yearOperator = "OR",
  ...criteria
}: {
  releases: DiscogsRelease[];
  searchQuery?: string;
  styleOperator?: ReleaseFilterCriteria["styleOperator"];
  formatOperator?: ReleaseFilterCriteria["formatOperator"];
  yearOperator?: ReleaseFilterCriteria["yearOperator"];
} & Omit<
  ReleaseFilterCriteria,
  "searchQuery" | "styleOperator" | "formatOperator" | "yearOperator"
>): DiscogsRelease[] =>
  computeFilterDerivedState({
    releases,
    searchQuery,
    styleOperator,
    formatOperator,
    yearOperator,
    ...criteria,
  }).filteredReleases;
