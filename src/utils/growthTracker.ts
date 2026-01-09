import type { DiscogsRelease } from "src/types";
import type { GrowthDataPoint } from "src/types/dashboard.types";

export function analyzeGrowthFromDates(
  releases: DiscogsRelease[],
): GrowthDataPoint[] {
  if (releases.length === 0) {
    return [];
  }

  // Parse dates and group by month
  const monthlyData = new Map<string, number>();

  releases.forEach((release) => {
    try {
      const dateAdded = new Date(release.date_added);
      if (Number.isNaN(dateAdded.getTime())) {
        return;
      }

      // Format as YYYY-MM for grouping
      const monthKey = `${dateAdded.getFullYear()}-${String(dateAdded.getMonth() + 1).padStart(2, "0")}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1);
    } catch {
      // Skip invalid dates
    }
  });

  // Convert to array and sort by date
  const sortedMonths = Array.from(monthlyData.entries()).sort(
    ([dateA], [dateB]) => dateA.localeCompare(dateB),
  );

  // Calculate cumulative totals
  let cumulative = 0;
  const growthData: GrowthDataPoint[] = sortedMonths.map(([date, count]) => {
    cumulative += count;
    return {
      date,
      count,
      cumulative,
    };
  });

  return growthData;
}

export function analyzeGrowthByYear(
  releases: DiscogsRelease[],
): GrowthDataPoint[] {
  if (releases.length === 0) {
    return [];
  }

  const yearlyData = new Map<number, number>();

  releases.forEach((release) => {
    try {
      const dateAdded = new Date(release.date_added);
      if (Number.isNaN(dateAdded.getTime())) {
        return;
      }

      const year = dateAdded.getFullYear();
      yearlyData.set(year, (yearlyData.get(year) || 0) + 1);
    } catch {
      // Skip invalid dates
    }
  });

  const sortedYears = Array.from(yearlyData.entries()).sort(
    ([yearA], [yearB]) => yearA - yearB,
  );

  let cumulative = 0;
  const growthData: GrowthDataPoint[] = sortedYears.map(([year, count]) => {
    cumulative += count;
    return {
      date: year.toString(),
      count,
      cumulative,
    };
  });

  return growthData;
}
