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
  styleOperator = "OR",
}: {
  releases: DiscogsRelease[];
  selectedStyles: string[];
  selectedYears: number[];
  selectedFormats: string[];
  searchQuery?: string;
  styleOperator?: "AND" | "OR";
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
      if (styleOperator === "AND") {
        // AND: release must have ALL selected styles
        const hasAllStyles = selectedStyles.every((style) =>
          releaseStyles.includes(style),
        );
        if (!hasAllStyles) return false;
      } else {
        // OR: release must have ANY of the selected styles (default)
        const hasMatchingStyle = releaseStyles.some((style) =>
          selectedStylesSet.has(style),
        );
        if (!hasMatchingStyle) return false;
      }
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

        searchableText = parts.join(" ");
        searchTextCache.set(releaseId, searchableText);
      }

      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });
};
