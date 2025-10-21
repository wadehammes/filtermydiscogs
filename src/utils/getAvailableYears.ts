import type { DiscogsRelease } from "src/types";

export const getAvailableYears = (releases: DiscogsRelease[]): number[] => {
  const yearSet = new Set<number>();

  releases.forEach((release) => {
    const year = release.basic_information.year;
    if (year && year > 0) {
      yearSet.add(year);
    }
  });

  return Array.from(yearSet).sort((a, b) => b - a); // Sort descending (newest first)
};
