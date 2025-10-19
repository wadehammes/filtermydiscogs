import type { DiscogsRelease } from "src/types";

export const filterReleases = (
  releases: DiscogsRelease[],
  selectedStyles: string[],
  selectedYears: number[],
): DiscogsRelease[] => {
  // Early return if no filters applied
  if (selectedStyles.length === 0 && selectedYears.length === 0) {
    return releases;
  }

  const selectedStylesSet =
    selectedStyles.length > 0 ? new Set(selectedStyles) : null;
  const selectedYearsSet =
    selectedYears.length > 0 ? new Set(selectedYears) : null;

  return releases.filter((release) => {
    // Check style filter
    if (selectedStylesSet) {
      const releaseStyles = release.basic_information.styles;
      const hasMatchingStyle = releaseStyles.some((style) =>
        selectedStylesSet.has(style),
      );
      if (!hasMatchingStyle) return false;
    }

    // Check year filter
    if (selectedYearsSet) {
      const releaseYear = release.basic_information.year;
      if (!selectedYearsSet.has(releaseYear)) return false;
    }

    return true;
  });
};
