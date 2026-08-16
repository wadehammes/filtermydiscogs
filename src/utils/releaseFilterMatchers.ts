import type { DiscogsRelease } from "src/types";
import type { StyleOperator } from "src/types/filters.types";
import { releaseMatchesFormatFilters } from "src/utils/formatFilterTags";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import { getReleaseSearchText } from "src/utils/releaseSearchIndex";

export const parseSearchTokens = (searchQuery: string): string[] => {
  const normalized = searchQuery.trim().toLowerCase();

  if (!normalized) {
    return [];
  }

  return normalized.split(/\s+/).filter(Boolean);
};

export const releaseMatchesSearch = (
  release: DiscogsRelease,
  searchTokens: readonly string[],
): boolean => {
  if (searchTokens.length === 0) {
    return true;
  }

  const searchableText = getReleaseSearchText(release);

  return searchTokens.every((token) => searchableText.includes(token));
};

export const releaseMatchesYear = (
  release: DiscogsRelease,
  selectedYearsSet: ReadonlySet<number> | null,
): boolean => {
  if (!selectedYearsSet) {
    return true;
  }

  return selectedYearsSet.has(release.basic_information.year);
};

export const releaseMatchesStyles = (
  release: DiscogsRelease,
  selectedStyles: readonly string[],
  styleOperator: StyleOperator,
  releaseGenreStyleTags: readonly string[] = getReleaseGenreStyleTags(
    release.basic_information,
  ),
): boolean => {
  if (selectedStyles.length === 0) {
    return true;
  }

  if (styleOperator === "AND") {
    return selectedStyles.every((tag) => releaseGenreStyleTags.includes(tag));
  }

  const selectedStylesSet = new Set(selectedStyles);

  if (styleOperator === "NONE") {
    return !releaseGenreStyleTags.some((tag) => selectedStylesSet.has(tag));
  }

  return releaseGenreStyleTags.some((tag) => selectedStylesSet.has(tag));
};

export const releaseMatchesFormats = (
  release: DiscogsRelease,
  selectedFormats: readonly string[],
  normalizedSelectedFormats?: ReadonlySet<string>,
  releaseFormatTags?: readonly string[],
): boolean => {
  if (selectedFormats.length === 0) {
    return true;
  }

  return releaseMatchesFormatFilters(
    release.basic_information.formats,
    selectedFormats,
    normalizedSelectedFormats,
    releaseFormatTags,
  );
};
