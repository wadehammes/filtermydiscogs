import type { StyleOperator } from "src/context/filters.context";
import type { DiscogsRelease } from "src/types";
import { filterReleases } from "src/utils/filterReleases";

export type FacetDimension = "styles" | "years" | "formats";

export function getFacetSourceReleases({
  releases,
  selectedStyles,
  selectedYears,
  selectedFormats,
  searchQuery,
  styleOperator,
  excludeDimension,
}: {
  releases: DiscogsRelease[];
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  searchQuery: string;
  styleOperator: StyleOperator;
  excludeDimension: FacetDimension;
}): DiscogsRelease[] {
  return filterReleases({
    releases,
    selectedStyles: excludeDimension === "styles" ? [] : selectedStyles,
    selectedYears: excludeDimension === "years" ? [] : selectedYears,
    selectedFormats: excludeDimension === "formats" ? [] : selectedFormats,
    searchQuery,
    styleOperator,
  });
}
