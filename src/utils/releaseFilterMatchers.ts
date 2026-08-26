import type { DiscogsRelease } from "src/types";
import type { StyleOperator, YearOperator } from "src/types/filters.types";
import {
  buildNormalizedFormatFilterSet,
  getReleaseFormatTags,
  normalizeFormatTag,
} from "src/utils/formatFilterTags";
import { matchSelectedTagsWithOperator } from "src/utils/matchFilterOperator";
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
  selectedYears: readonly number[],
  yearOperator: YearOperator = "OR",
): boolean => {
  if (selectedYears.length === 0) {
    return true;
  }

  const releaseYear = release.basic_information.year;
  const matchesAny = selectedYears.includes(releaseYear);

  return yearOperator === "NONE" ? !matchesAny : matchesAny;
};

export const releaseMatchesStyles = (
  release: DiscogsRelease,
  selectedStyles: readonly string[],
  styleOperator: StyleOperator,
  releaseGenreStyleTags: readonly string[] = getReleaseGenreStyleTags(
    release.basic_information,
  ),
): boolean =>
  matchSelectedTagsWithOperator(selectedStyles, styleOperator, (tag) =>
    releaseGenreStyleTags.includes(tag),
  );

export const releaseMatchesFormats = (
  release: DiscogsRelease,
  selectedFormats: readonly string[],
  formatOperator: StyleOperator,
  normalizedSelectedFormats?: ReadonlySet<string>,
  releaseFormatTags?: readonly string[],
): boolean => {
  if (selectedFormats.length === 0) {
    return true;
  }

  const selectedFormatsSet =
    normalizedSelectedFormats ??
    buildNormalizedFormatFilterSet(selectedFormats);
  const releaseTags =
    releaseFormatTags ??
    getReleaseFormatTags(release.basic_information.formats);

  if (formatOperator === "AND") {
    return matchSelectedTagsWithOperator(selectedFormats, "AND", (format) =>
      releaseTags.some(
        (tag) => normalizeFormatTag(tag) === normalizeFormatTag(format),
      ),
    );
  }

  const matchesAnySelected = releaseTags.some((tag) =>
    selectedFormatsSet.has(normalizeFormatTag(tag)),
  );

  return formatOperator === "NONE" ? !matchesAnySelected : matchesAnySelected;
};
