import type { DiscogsRelease } from "src/types";

// Cache for searchable text to avoid recomputation
const searchTextCache = new Map<string, string>();

// Cleanup function to clear cache when needed
export const clearSearchCache = () => {
  searchTextCache.clear();
};

export const filterReleases = ({
  releases,
  selectedStyles,
  selectedYears,
  selectedFormats,
  searchQuery,
}: {
  releases: DiscogsRelease[];
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  searchQuery?: string;
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
      const releaseStyles = release.basic_information.styles;
      const hasMatchingStyle = releaseStyles.some((style) =>
        selectedStylesSet.has(style),
      );
      if (!hasMatchingStyle) return false;
    }

    if (selectedFormatsSet) {
      const releaseFormats = release.basic_information.formats;
      const hasMatchingFormat = releaseFormats.some((format) =>
        selectedFormatsSet.has(format.name),
      );
      if (!hasMatchingFormat) return false;
    }

    if (searchTerm) {
      const releaseId = release.instance_id;
      let searchableText = searchTextCache.get(releaseId);

      if (!searchableText) {
        const { title, artists, labels } = release.basic_information;
        searchableText = [
          title.toLowerCase(),
          ...artists.map((a) => a.name.toLowerCase()),
          ...labels.map((l) => l.name.toLowerCase()),
        ].join(" ");
        searchTextCache.set(releaseId, searchableText);
      }

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });
};
