import type { DiscogsRelease } from "src/types";

export interface CollectionMilestone {
  label: string;
  value: string;
  description?: string;
  release?: DiscogsRelease;
}

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

    milestones.push({
      label: "Years Collecting",
      value: yearsCollecting.toString(),
      description: `Since ${firstDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}`,
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
