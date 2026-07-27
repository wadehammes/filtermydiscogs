import type { StyleOperator } from "src/context/filters.context";
import type { DiscogsRelease } from "src/types";
import { releaseMatchesFormatFilters } from "src/utils/formatFilterTags";
import { getReleaseGenreStyleTags } from "src/utils/releaseGenreStyleTags";
import { getReleaseNotesSearchText } from "src/utils/releaseNotes";

const searchTextCache = new Map<string, string>();

export const clearSearchCache = () => {
  searchTextCache.clear();
};

export const filterReleases = ({
  releases,
  selectedStyles,
  selectedYears,
  selectedFormats,
  searchQuery,
  styleOperator = "OR",
}: {
  releases: DiscogsRelease[];
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  searchQuery?: string;
  styleOperator?: StyleOperator;
}): DiscogsRelease[] => {
  if (
    selectedStyles.length === 0 &&
    selectedYears.length === 0 &&
    selectedFormats.length === 0 &&
    !searchQuery?.trim()
  ) {
    return releases;
  }

  const selectedStylesSet =
    selectedStyles.length > 0 ? new Set(selectedStyles) : null;
  const selectedYearsSet =
    selectedYears.length > 0 ? new Set(selectedYears) : null;
  const selectedFormatsSet =
    selectedFormats.length > 0 ? new Set(selectedFormats) : null;
  const searchTerm = searchQuery?.trim().toLowerCase();

  return releases.filter((release) => {
    if (selectedYearsSet) {
      const releaseYear = release.basic_information.year;
      if (!selectedYearsSet.has(releaseYear)) return false;
    }

    if (selectedStylesSet) {
      const releaseGenreStyleTags = getReleaseGenreStyleTags(
        release.basic_information,
      );
      if (styleOperator === "AND") {
        const hasAllTags = selectedStyles.every((tag) =>
          releaseGenreStyleTags.includes(tag),
        );
        if (!hasAllTags) return false;
      } else if (styleOperator === "NONE") {
        const hasAnySelectedTag = releaseGenreStyleTags.some((tag) =>
          selectedStylesSet.has(tag),
        );
        if (hasAnySelectedTag) return false;
      } else {
        const hasMatchingTag = releaseGenreStyleTags.some((tag) =>
          selectedStylesSet.has(tag),
        );
        if (!hasMatchingTag) return false;
      }
    }

    if (selectedFormatsSet) {
      const hasMatchingFormat = releaseMatchesFormatFilters(
        release.basic_information.formats,
        selectedFormats,
      );
      if (!hasMatchingFormat) return false;
    }

    if (searchTerm) {
      const releaseId = release.instance_id;
      let searchableText = searchTextCache.get(releaseId);

      if (!searchableText) {
        const { title, artists, labels } = release.basic_information;
        const parts: string[] = [title.toLowerCase()];

        for (const artist of artists) {
          parts.push(artist.name.toLowerCase());
        }

        for (const label of labels) {
          parts.push(label.name.toLowerCase());
          if (label.catno) {
            parts.push(String(label.catno).toLowerCase());
          }
        }

        const notesText = getReleaseNotesSearchText(release);
        if (notesText) {
          parts.push(notesText);
        }

        for (const tag of getReleaseGenreStyleTags(release.basic_information)) {
          parts.push(tag.toLowerCase());
        }

        searchableText = parts.join(" ");
        searchTextCache.set(releaseId, searchableText);
      }

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });
};
