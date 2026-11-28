import type { DiscogsRelease } from "src/types";
import type {
  FacetOptions,
  ReleaseFilterCriteria,
} from "src/types/filters.types";
import {
  buildNormalizedFormatFilterSet,
  sortFormatTags,
} from "src/utils/formatFilterTags";
import {
  parseSearchTokens,
  releaseMatchesFormats,
  releaseMatchesSearch,
  releaseMatchesStyles,
  releaseMatchesYear,
} from "src/utils/releaseFilterMatchers";
import { getReleaseSearchIndexEntry } from "src/utils/releaseSearchIndex";

export interface FilterDerivedState {
  filteredReleases: DiscogsRelease[];
  facetOptions: FacetOptions;
}

const emptyFacetOptions = (): FacetOptions => ({
  availableStyles: [],
  availableYears: [],
  availableFormats: [],
});

const facetOptionsFromSets = (
  styleSet: Set<string>,
  yearSet: Set<number>,
  formatSet: Set<string>,
): FacetOptions => ({
  availableStyles: Array.from(styleSet).sort(),
  availableYears: Array.from(yearSet).sort((first, second) => second - first),
  availableFormats: sortFormatTags(Array.from(formatSet)),
});

export const computeFilterDerivedState = ({
  releases,
  selectedStyles,
  excludedStyles = [],
  selectedYears,
  selectedFormats,
  searchQuery,
  styleOperator,
  formatOperator,
  yearOperator,
}: {
  releases: DiscogsRelease[];
} & ReleaseFilterCriteria): FilterDerivedState => {
  const searchTokens = parseSearchTokens(searchQuery);
  const hasActiveFilters =
    selectedStyles.length > 0 ||
    excludedStyles.length > 0 ||
    selectedYears.length > 0 ||
    selectedFormats.length > 0 ||
    searchTokens.length > 0;

  if (!hasActiveFilters) {
    return {
      filteredReleases: releases,
      facetOptions: computeFacetOptionsFromReleases(releases),
    };
  }

  const normalizedSelectedFormats =
    selectedFormats.length > 0
      ? buildNormalizedFormatFilterSet(selectedFormats)
      : undefined;

  const styleSet = new Set<string>();
  const yearSet = new Set<number>();
  const formatSet = new Set<string>();
  const filteredReleases: DiscogsRelease[] = [];

  for (const release of releases) {
    const { genreStyleTags, formatTags } = getReleaseSearchIndexEntry(release);
    const matchesSearch = releaseMatchesSearch(release, searchTokens);
    const matchesYear = releaseMatchesYear(
      release,
      selectedYears,
      yearOperator,
    );
    const matchesIncludedStyles = releaseMatchesStyles(
      release,
      selectedStyles,
      styleOperator,
      genreStyleTags,
    );
    const matchesExcludedStyles =
      excludedStyles.length === 0 ||
      !releaseMatchesStyles(release, excludedStyles, "OR", genreStyleTags);
    const matchesStyles = matchesIncludedStyles && matchesExcludedStyles;
    const matchesFormats = releaseMatchesFormats(
      release,
      selectedFormats,
      formatOperator,
      normalizedSelectedFormats,
      formatTags,
    );

    if (matchesSearch && matchesYear && matchesStyles && matchesFormats) {
      filteredReleases.push(release);
    }

    if (matchesSearch && matchesYear && matchesFormats) {
      for (const tag of genreStyleTags) {
        styleSet.add(tag);
      }
    }

    if (matchesSearch && matchesYear && matchesStyles) {
      for (const tag of formatTags) {
        formatSet.add(tag);
      }
    }

    if (matchesSearch && matchesFormats && matchesStyles) {
      const year = release.basic_information.year;
      if (year > 0) {
        yearSet.add(year);
      }
    }
  }

  return {
    filteredReleases,
    facetOptions: facetOptionsFromSets(styleSet, yearSet, formatSet),
  };
};

const computeFacetOptionsFromReleases = (
  releases: DiscogsRelease[],
): FacetOptions => {
  if (releases.length === 0) {
    return emptyFacetOptions();
  }

  const styleSet = new Set<string>();
  const yearSet = new Set<number>();
  const formatSet = new Set<string>();

  for (const release of releases) {
    const { genreStyleTags, formatTags } = getReleaseSearchIndexEntry(release);

    for (const tag of genreStyleTags) {
      styleSet.add(tag);
    }

    for (const tag of formatTags) {
      formatSet.add(tag);
    }

    const year = release.basic_information.year;
    if (year > 0) {
      yearSet.add(year);
    }
  }

  return facetOptionsFromSets(styleSet, yearSet, formatSet);
};
