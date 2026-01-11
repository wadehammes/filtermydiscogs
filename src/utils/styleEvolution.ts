import type { DiscogsRelease } from "src/types";

export interface StyleEvolutionData {
  period: string;
  dateRange: string;
  releaseCount: number;
  styles: Array<{ name: string; count: number; percentage: number }>;
}

export function calculateStyleEvolution(
  releases: DiscogsRelease[],
): StyleEvolutionData[] {
  if (releases.length === 0) {
    return [];
  }

  // Filter and sort releases by date_added
  const releasesWithDates = releases
    .map((release) => {
      try {
        const dateAdded = new Date(release.date_added);
        if (Number.isNaN(dateAdded.getTime())) {
          return null;
        }
        return { release, dateAdded };
      } catch {
        return null;
      }
    })
    .filter(
      (item): item is { release: DiscogsRelease; dateAdded: Date } =>
        item !== null,
    )
    .sort((a, b) => a.dateAdded.getTime() - b.dateAdded.getTime());

  if (releasesWithDates.length === 0) {
    return [];
  }

  // Find the date range of the collection
  const firstItem = releasesWithDates[0];
  const lastIndex = releasesWithDates.length - 1;
  const lastItem = releasesWithDates[lastIndex];

  if (firstItem === undefined) {
    return [];
  }

  if (lastItem === undefined) {
    return [];
  }

  const firstDate = firstItem.dateAdded;
  const lastDate = lastItem.dateAdded;

  // Calculate the total time span
  const totalTimeSpan = lastDate.getTime() - firstDate.getTime();
  const quarterTimeSpan = totalTimeSpan / 4;

  // Create 4 time-based quarters
  const periods: StyleEvolutionData[] = [];

  for (let i = 0; i < 4; i++) {
    const quarterStartTime = firstDate.getTime() + i * quarterTimeSpan;
    const quarterEndTime =
      i === 3
        ? lastDate.getTime() + 1 // Include the last date in the final quarter
        : firstDate.getTime() + (i + 1) * quarterTimeSpan;

    const quarterStart = new Date(quarterStartTime);
    const quarterEnd = new Date(quarterEndTime);

    // Filter releases that fall within this quarter
    const periodReleases = releasesWithDates
      .filter(({ dateAdded }) => {
        const time = dateAdded.getTime();
        return time >= quarterStartTime && time < quarterEndTime;
      })
      .map(({ release }) => release);

    if (periodReleases.length === 0) continue;

    const dateRange =
      quarterStart.getFullYear() === quarterEnd.getFullYear() &&
      quarterStart.getMonth() === quarterEnd.getMonth()
        ? quarterStart.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : `${quarterStart.toLocaleDateString("en-US", { month: "short", year: "numeric" })} - ${quarterEnd.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

    const styleCounts = new Map<string, number>();
    periodReleases.forEach((release) => {
      release.basic_information.styles.forEach((style) => {
        const normalized = style.toLowerCase();
        styleCounts.set(normalized, (styleCounts.get(normalized) || 0) + 1);
      });
    });

    const totalStyleOccurrences = Array.from(styleCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    const topStyles = Array.from(styleCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          totalStyleOccurrences > 0
            ? Math.round((count / totalStyleOccurrences) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const periodLabel =
      i === 0
        ? "First Period"
        : i === 1
          ? "Second Period"
          : i === 2
            ? "Third Period"
            : "Most Recent Period";

    periods.push({
      period: periodLabel,
      dateRange,
      releaseCount: periodReleases.length,
      styles: topStyles,
    });
  }

  return periods;
}
