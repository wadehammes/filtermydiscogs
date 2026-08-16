import type { DiscogsRelease } from "src/types";
import type { ReleaseFilterCriteria } from "src/types/filters.types";
import { computeFilterDerivedState } from "src/utils/computeFilterDerivedState";

export const computeFacetOptions = ({
  releases,
  ...criteria
}: {
  releases: DiscogsRelease[];
} & ReleaseFilterCriteria) =>
  computeFilterDerivedState({ releases, ...criteria }).facetOptions;
