import type { DiscogsRelease } from "src/types";

export interface CollectionMilestone {
  label: string;
  value: string;
  description?: string;
  release?: DiscogsRelease;
}

export const getMilestoneSortTimestamp = (
  milestone: CollectionMilestone,
): number => {
  if (milestone.label === "Oldest Release") {
    const pressingYear =
      milestone.release?.basic_information.year ??
      Number.parseInt(milestone.value, 10);

    if (!Number.isNaN(pressingYear) && pressingYear > 0) {
      return new Date(pressingYear, 6, 1).getTime();
    }
  }

  if (milestone.label === "Most Active Year") {
    const year = Number.parseInt(milestone.value, 10);
    if (!Number.isNaN(year)) {
      return new Date(year, 11, 31).getTime();
    }
  }

  if (milestone.release) {
    const dateAdded = new Date(milestone.release.date_added);
    if (!Number.isNaN(dateAdded.getTime())) {
      return dateAdded.getTime();
    }
  }

  const parsed = Date.parse(milestone.value);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const yearMatch = milestone.value.match(/\b(19|20)\d{2}\b/);
  if (yearMatch?.[0]) {
    return new Date(Number.parseInt(yearMatch[0], 10), 0, 1).getTime();
  }

  return 0;
};

export const sortMilestonesChronologically = (
  milestones: CollectionMilestone[],
): CollectionMilestone[] =>
  [...milestones].sort(
    (a, b) => getMilestoneSortTimestamp(a) - getMilestoneSortTimestamp(b),
  );

export function calculateMilestones(
  releases: DiscogsRelease[],
): CollectionMilestone[] {
  if (releases.length === 0) {
    return [];
  }

  const milestones: CollectionMilestone[] = [];

  const sortedByDate = [...releases].sort(
    (a, b) =>
      new Date(a.date_added).getTime() - new Date(b.date_added).getTime(),
  );

  const firstRelease = sortedByDate[0];
  if (firstRelease) {
    const firstDate = new Date(firstRelease.date_added);
    const today = new Date();
    const yearsCollecting = Math.floor(
      (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
    );
    const firstDateFormatted = firstDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    milestones.push({
      label: "First release added",
      value: `${firstDateFormatted} • ${yearsCollecting} years collecting`,
      release: firstRelease,
    });
  }

  const releasesWithYear = releases.filter((r) => r.basic_information.year > 0);
  if (releasesWithYear.length > 0) {
    const oldestRelease = [...releasesWithYear].sort(
      (a, b) => a.basic_information.year - b.basic_information.year,
    )[0];

    if (oldestRelease) {
      milestones.push({
        label: "Oldest Release",
        value: oldestRelease.basic_information.year.toString(),
        release: oldestRelease,
      });
    }
  }

  const milestoneCounts = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
  const totalReleases = releases.length;

  for (const count of milestoneCounts) {
    if (totalReleases >= count) {
      const milestoneRelease = sortedByDate[count - 1];
      if (milestoneRelease) {
        const milestoneDate = new Date(milestoneRelease.date_added);
        milestones.push({
          label: `${count}th Release`,
          value: milestoneDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          release: milestoneRelease,
        });
      }
    }
  }

  const releasesByYear = new Map<number, number>();
  releases.forEach((release) => {
    const year = new Date(release.date_added).getFullYear();
    releasesByYear.set(year, (releasesByYear.get(year) || 0) + 1);
  });

  if (releasesByYear.size > 0) {
    const sortedYears = Array.from(releasesByYear.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const mostActiveYear = sortedYears[0];

    if (mostActiveYear) {
      milestones.push({
        label: "Most Active Year",
        value: mostActiveYear[0].toString(),
        description: `${mostActiveYear[1]} releases added`,
      });
    }
  }

  return milestones;
}
