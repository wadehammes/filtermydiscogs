import type { DiscogsRelease } from "src/types";

export function getOnThisDayReleases(
  releases: DiscogsRelease[],
): DiscogsRelease[] {
  if (!releases || releases.length === 0) {
    return [];
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const onThisDayReleases = releases.filter((release) => {
    try {
      const dateAdded = new Date(release.date_added);
      if (Number.isNaN(dateAdded.getTime())) {
        return false;
      }

      const releaseMonth = dateAdded.getMonth();
      const releaseDay = dateAdded.getDate();

      return (
        releaseMonth === currentMonth &&
        releaseDay === currentDay &&
        dateAdded.getFullYear() < today.getFullYear()
      );
    } catch {
      return false;
    }
  });

  return onThisDayReleases.sort((a, b) => {
    const dateA = new Date(a.date_added);
    const dateB = new Date(b.date_added);
    return dateA.getTime() - dateB.getTime();
  });
}
