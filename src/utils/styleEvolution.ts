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

  const sortedByDate = [...releases].sort(
    (a, b) =>
      new Date(a.date_added).getTime() - new Date(b.date_added).getTime(),
  );

  const totalReleases = sortedByDate.length;
  const quarterSize = Math.ceil(totalReleases / 4);

  const periods: StyleEvolutionData[] = [];

  for (let i = 0; i < 4; i++) {
    const start = i * quarterSize;
    const end = Math.min(start + quarterSize, totalReleases);
    const periodReleases = sortedByDate.slice(start, end);

    if (periodReleases.length === 0) continue;

    const firstRelease = periodReleases[0];
    const lastRelease = periodReleases[periodReleases.length - 1];
    if (!(firstRelease && lastRelease)) continue;

    const firstDate = new Date(firstRelease.date_added);
    const lastDate = new Date(lastRelease.date_added);

    const dateRange =
      firstDate.getFullYear() === lastDate.getFullYear() &&
      firstDate.getMonth() === lastDate.getMonth()
        ? firstDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : `${firstDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} - ${lastDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

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
        ? "First 25%"
        : i === 1
          ? "Second 25%"
          : i === 2
            ? "Third 25%"
            : "Most Recent 25%";

    periods.push({
      period: periodLabel,
      dateRange,
      releaseCount: periodReleases.length,
      styles: topStyles,
    });
  }

  return periods;
}
