import type { DiscogsRelease } from "src/types";

/**
 * Get releases that were added on the current date (month/day) in previous years
 */
export function getOnThisDayReleases(
  releases: DiscogsRelease[],
): DiscogsRelease[] {
  if (!releases || releases.length === 0) {
    return [];
  }

  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  const currentDay = today.getDate(); // 1-31

  const onThisDayReleases = releases.filter((release) => {
    try {
      const dateAdded = new Date(release.date_added);
      if (Number.isNaN(dateAdded.getTime())) {
        return false;
      }

      const releaseMonth = dateAdded.getMonth();
      const releaseDay = dateAdded.getDate();

      // Match month and day, but exclude current year (only show past years)
      return (
        releaseMonth === currentMonth &&
        releaseDay === currentDay &&
        dateAdded.getFullYear() < today.getFullYear()
      );
    } catch {
      return false;
    }
  });

  // Sort by year added (newest first)
  return onThisDayReleases.sort((a, b) => {
    const dateA = new Date(a.date_added);
    const dateB = new Date(b.date_added);
    return dateB.getTime() - dateA.getTime();
  });
}
