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

export const computeFilterDerivedState = ({
  releases,
  selectedStyles,
  selectedYears,
  selectedFormats,
  searchQuery,
  styleOperator,
}: {
  releases: DiscogsRelease[];
} & ReleaseFilterCriteria): FilterDerivedState => {
  const searchTokens = parseSearchTokens(searchQuery);
  const hasActiveFilters =
    selectedStyles.length > 0 ||
    selectedYears.length > 0 ||
    selectedFormats.length > 0 ||
    searchTokens.length > 0;

  if (!hasActiveFilters) {
    return {
      filteredReleases: releases,
      facetOptions: computeFacetOptionsFromReleases(releases),
    };
  }

  const selectedYearsSet =
    selectedYears.length > 0 ? new Set(selectedYears) : null;
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
    const matchesYear = releaseMatchesYear(release, selectedYearsSet);
    const matchesStyles = releaseMatchesStyles(
      release,
      selectedStyles,
      styleOperator,
      genreStyleTags,
    );
    const matchesFormats = releaseMatchesFormats(
      release,
      selectedFormats,
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
    facetOptions: {
      availableStyles: Array.from(styleSet).sort(),
      availableYears: Array.from(yearSet).sort((a, b) => b - a),
      availableFormats: sortFormatTags(Array.from(formatSet)),
    },
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

  return {
    availableStyles: Array.from(styleSet).sort(),
    availableYears: Array.from(yearSet).sort((a, b) => b - a),
    availableFormats: sortFormatTags(Array.from(formatSet)),
  };
};
