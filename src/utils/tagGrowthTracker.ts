import type { DiscogsRelease } from "src/types";
import type { GrowthDataPoint } from "src/types/dashboard.types";
import { analyzeGrowthFromDates } from "src/utils/growthTracker";

export interface TagOption {
  value: string;
  label: string;
  count: number;
}

export interface DualSeriesPoint {
  date: string;
  primaryValue: number;
  secondaryValue: number;
}

const formatDistributionLabel = (labelText: string): string => {
  const trimmed = labelText.trim();
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const parseMonthKey = (key: string): { year: number; month: number } => {
  const [yearPart, monthPart] = key.split("-");
  return {
    year: parseInt(yearPart ?? "0", 10),
    month: parseInt(monthPart ?? "0", 10),
  };
};

const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, "0")}`;

const iterateMonthRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  let { year, month } = parseMonthKey(start);
  const endParsed = parseMonthKey(end);

  while (
    year < endParsed.year ||
    (year === endParsed.year && month <= endParsed.month)
  ) {
    dates.push(toMonthKey(year, month));
    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return dates;
};

const getReleaseMonthKey = (release: DiscogsRelease): string | null => {
  try {
    const dateAdded = new Date(release.date_added);
    if (Number.isNaN(dateAdded.getTime())) {
      return null;
    }

    return toMonthKey(dateAdded.getFullYear(), dateAdded.getMonth() + 1);
  } catch {
    return null;
  }
};

const getPrimaryMediaTypeLabel = (release: DiscogsRelease): string | null => {
  const name = release.basic_information.formats[0]?.name?.trim();
  if (!name) {
    return null;
  }

  return formatDistributionLabel(name);
};

const toSharePercent = (part: number, total: number): number =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

export const releaseHasStyle = (
  release: DiscogsRelease,
  styleKey: string,
): boolean =>
  release.basic_information.styles.some(
    (style) => style.trim().toLowerCase() === styleKey,
  );

export const releaseHasGenre = (
  release: DiscogsRelease,
  genreLabel: string,
): boolean =>
  (release.basic_information.genres ?? []).some(
    (genre) => formatDistributionLabel(genre) === genreLabel,
  );

export const releaseHasArtist = (
  release: DiscogsRelease,
  artistName: string,
): boolean =>
  release.basic_information.artists.some(
    (artist) => artist.name?.trim() === artistName,
  );

export const releaseHasMediaType = (
  release: DiscogsRelease,
  mediaTypeLabel: string,
): boolean => getPrimaryMediaTypeLabel(release) === mediaTypeLabel;

export const releaseHasGenreAndStyle = (
  release: DiscogsRelease,
  genreLabel: string,
  styleKey: string,
): boolean =>
  releaseHasGenre(release, genreLabel) && releaseHasStyle(release, styleKey);

export function collectStyleOptions(releases: DiscogsRelease[]): TagOption[] {
  const counts = new Map<string, number>();

  for (const release of releases) {
    for (const style of release.basic_information.styles) {
      const key = style.trim().toLowerCase();
      if (!key) {
        continue;
      }

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: formatDistributionLabel(value),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function collectGenreOptions(releases: DiscogsRelease[]): TagOption[] {
  const counts = new Map<string, number>();

  for (const release of releases) {
    for (const genre of release.basic_information.genres ?? []) {
      const label = formatDistributionLabel(genre);
      if (!label) {
        continue;
      }

      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function collectStyleOptionsForGenre(
  releases: DiscogsRelease[],
  genreLabel: string,
): TagOption[] {
  const genreReleases = releases.filter((release) =>
    releaseHasGenre(release, genreLabel),
  );

  return collectStyleOptions(genreReleases);
}

export function collectArtistOptions(releases: DiscogsRelease[]): TagOption[] {
  const counts = new Map<string, number>();

  for (const release of releases) {
    for (const artist of release.basic_information.artists) {
      const name = artist.name?.trim();
      if (!name) {
        continue;
      }

      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function collectMediaTypeOptions(
  releases: DiscogsRelease[],
): TagOption[] {
  const counts = new Map<string, number>();

  for (const release of releases) {
    const mediaType = getPrimaryMediaTypeLabel(release);
    if (!mediaType) {
      continue;
    }

    counts.set(mediaType, (counts.get(mediaType) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function analyzeTagGrowthFromDates(
  releases: DiscogsRelease[],
  matches: (release: DiscogsRelease) => boolean,
): GrowthDataPoint[] {
  return analyzeGrowthFromDates(releases.filter(matches));
}

export function fillGrowthTimeline(data: GrowthDataPoint[]): GrowthDataPoint[] {
  if (data.length === 0) {
    return [];
  }

  const first = data[0];
  const last = data.at(-1);

  if (!(first && last)) {
    return [];
  }

  const byMonth = new Map(data.map((point) => [point.date, point]));
  const dates = iterateMonthRange(first.date, last.date);
  let cumulative = 0;

  return dates.map((date) => {
    const point = byMonth.get(date);

    if (point) {
      cumulative = point.cumulative;
    }

    return {
      date,
      count: point?.count ?? 0,
      cumulative,
    };
  });
}

export function mergeDualCumulativeSeries(
  primaryData: GrowthDataPoint[],
  secondaryData: GrowthDataPoint[],
): DualSeriesPoint[] {
  const primaryPoints = fillGrowthTimeline(primaryData);
  const secondaryPoints = fillGrowthTimeline(secondaryData);
  const startCandidates = [
    primaryPoints[0]?.date,
    secondaryPoints[0]?.date,
  ].filter((date): date is string => Boolean(date));
  const endCandidates = [
    primaryPoints.at(-1)?.date,
    secondaryPoints.at(-1)?.date,
  ].filter((date): date is string => Boolean(date));

  if (startCandidates.length === 0 || endCandidates.length === 0) {
    return [];
  }

  const startDate = startCandidates.sort()[0];
  const endDate = endCandidates.sort().at(-1);

  if (!(startDate && endDate)) {
    return [];
  }

  const primaryMap = new Map(
    primaryPoints.map((point) => [point.date, point.cumulative]),
  );
  const secondaryMap = new Map(
    secondaryPoints.map((point) => [point.date, point.cumulative]),
  );
  const dates = iterateMonthRange(startDate, endDate);
  let primaryValue = 0;
  let secondaryValue = 0;

  return dates.map((date) => {
    if (primaryMap.has(date)) {
      primaryValue = primaryMap.get(date) ?? primaryValue;
    }

    if (secondaryMap.has(date)) {
      secondaryValue = secondaryMap.get(date) ?? secondaryValue;
    }

    return {
      date,
      primaryValue,
      secondaryValue,
    };
  });
}

export function mergeDualMonthlyShareSeries(
  releases: DiscogsRelease[],
  primaryMatches: (release: DiscogsRelease) => boolean,
  secondaryMatches: (release: DiscogsRelease) => boolean,
): DualSeriesPoint[] {
  const monthlyTotal = new Map<string, number>();
  const monthlyPrimary = new Map<string, number>();
  const monthlySecondary = new Map<string, number>();

  for (const release of releases) {
    const monthKey = getReleaseMonthKey(release);
    if (!monthKey) {
      continue;
    }

    monthlyTotal.set(monthKey, (monthlyTotal.get(monthKey) ?? 0) + 1);

    if (primaryMatches(release)) {
      monthlyPrimary.set(monthKey, (monthlyPrimary.get(monthKey) ?? 0) + 1);
    }

    if (secondaryMatches(release)) {
      monthlySecondary.set(monthKey, (monthlySecondary.get(monthKey) ?? 0) + 1);
    }
  }

  return [...monthlyTotal.keys()].sort().map((date) => {
    const total = monthlyTotal.get(date) ?? 0;
    const primaryCount = monthlyPrimary.get(date) ?? 0;
    const secondaryCount = monthlySecondary.get(date) ?? 0;

    return {
      date,
      primaryValue: toSharePercent(primaryCount, total),
      secondaryValue: toSharePercent(secondaryCount, total),
    };
  });
}

export function mergeStyleWithinGenreShareSeries(
  releases: DiscogsRelease[],
  genreLabel: string,
  styleKey: string,
): DualSeriesPoint[] {
  const monthlyTotal = new Map<string, number>();
  const monthlyGenre = new Map<string, number>();
  const monthlyGenreStyle = new Map<string, number>();

  for (const release of releases) {
    const monthKey = getReleaseMonthKey(release);
    if (!monthKey) {
      continue;
    }

    monthlyTotal.set(monthKey, (monthlyTotal.get(monthKey) ?? 0) + 1);

    if (!releaseHasGenre(release, genreLabel)) {
      continue;
    }

    monthlyGenre.set(monthKey, (monthlyGenre.get(monthKey) ?? 0) + 1);

    if (releaseHasStyle(release, styleKey)) {
      monthlyGenreStyle.set(
        monthKey,
        (monthlyGenreStyle.get(monthKey) ?? 0) + 1,
      );
    }
  }

  return [...monthlyTotal.keys()].sort().map((date) => {
    const total = monthlyTotal.get(date) ?? 0;
    const genreCount = monthlyGenre.get(date) ?? 0;
    const genreStyleCount = monthlyGenreStyle.get(date) ?? 0;

    return {
      date,
      primaryValue: toSharePercent(genreStyleCount, genreCount),
      secondaryValue: toSharePercent(genreCount, total),
    };
  });
}
