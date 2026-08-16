import type { DiscogsRelease } from "src/types";
import type { ReleaseFilterCriteria } from "src/types/filters.types";
import { computeFilterDerivedState } from "src/utils/computeFilterDerivedState";

export const filterReleases = ({
  releases,
  searchQuery = "",
  styleOperator = "OR",
  ...criteria
}: {
  releases: DiscogsRelease[];
  searchQuery?: string;
  styleOperator?: ReleaseFilterCriteria["styleOperator"];
} & Omit<
  ReleaseFilterCriteria,
  "searchQuery" | "styleOperator"
>): DiscogsRelease[] =>
  computeFilterDerivedState({
    releases,
    searchQuery,
    styleOperator,
    ...criteria,
  }).filteredReleases;
