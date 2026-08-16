import type { DiscogsRelease } from "src/types";
import type {
  AcquisitionPeriodHighlight,
  AcquisitionStreaksSummary,
  YearInReviewSummary,
  YearInReviewTimeframe,
  YearInReviewTimeframeMeta,
} from "src/types/dashboard.types";
import { startOfUtcDay } from "src/utils/dateHelpers";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const YEAR_IN_REVIEW_TIMEFRAME_OPTIONS: Array<{
  value: YearInReviewTimeframe;
  label: string;
}> = [
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "quarter", label: "Last quarter" },
  { value: "year", label: "Last year" },
];

export const YEAR_IN_REVIEW_TIMEFRAME_META: Record<
  YearInReviewTimeframe,
  YearInReviewTimeframeMeta
> = {
  week: {
    eyebrow: "Last 7 days",
    recentLabel: "This week",
    priorLabel: "Prior week",
    compareLabel: "vs prior week",
  },
  month: {
    eyebrow: "Last 30 days",
    recentLabel: "This month",
    priorLabel: "Prior month",
    compareLabel: "vs prior month",
  },
  quarter: {
    eyebrow: "Last 90 days",
    recentLabel: "This quarter",
    priorLabel: "Prior quarter",
    compareLabel: "vs prior quarter",
  },
  year: {
    eyebrow: "Rolling 12 months",
    recentLabel: "This year",
    priorLabel: "Prior year",
    compareLabel: "vs prior year",
  },
};

const TIMEFRAME_MS: Record<Exclude<YearInReviewTimeframe, "year">, number> = {
  week: 7 * MS_PER_DAY,
  month: 30 * MS_PER_DAY,
  quarter: 90 * MS_PER_DAY,
};

const formatGenreLabel = (genreName: string): string => {
  const trimmed = genreName.trim();
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const parseReleaseDateAdded = (release: DiscogsRelease): Date | null => {
  const dateAdded = new Date(release.date_added);
  if (Number.isNaN(dateAdded.getTime())) {
    return null;
  }

  return dateAdded;
};

const getRollingYearBounds = (referenceDate: Date) => {
  const recentStart = new Date(referenceDate);
  recentStart.setFullYear(recentStart.getFullYear() - 1);

  const priorStart = new Date(referenceDate);
  priorStart.setFullYear(priorStart.getFullYear() - 2);

  return {
    recentStart,
    priorStart,
    priorEnd: recentStart,
  };
};

const getPeriodBounds = (
  timeframe: YearInReviewTimeframe,
  referenceDate: Date,
) => {
  if (timeframe === "year") {
    return getRollingYearBounds(referenceDate);
  }

  const durationMs = TIMEFRAME_MS[timeframe];
  const recentStart = new Date(referenceDate.getTime() - durationMs);
  const priorStart = new Date(recentStart.getTime() - durationMs);

  return {
    recentStart,
    priorStart,
    priorEnd: recentStart,
  };
};

const isWithinRange = (date: Date, rangeStart: Date, rangeEnd: Date): boolean =>
  date >= rangeStart && date < rangeEnd;

const formatMonthYear = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const getCalendarQuarter = (date: Date): { year: number; quarter: number } => ({
  year: date.getUTCFullYear(),
  quarter: Math.floor(date.getUTCMonth() / 3) + 1,
});

const formatQuarterLabel = (year: number, quarter: number): string =>
  `Q${quarter} ${year}`;

const formatDayLabel = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

interface PeriodCount {
  sortKey: string;
  label: string;
  count: number;
}

const pickMaxPeriod = (periods: PeriodCount[]): PeriodCount | null => {
  if (periods.length === 0) {
    return null;
  }

  return periods.reduce<PeriodCount | null>((best, period) => {
    if (!best || period.count > best.count) {
      return period;
    }

    if (period.count === best.count && period.sortKey > best.sortKey) {
      return period;
    }

    return best;
  }, null);
};

const pickMinPeriod = (periods: PeriodCount[]): PeriodCount | null => {
  if (periods.length === 0) {
    return null;
  }

  return periods.reduce<PeriodCount | null>((best, period) => {
    if (!best || period.count < best.count) {
      return period;
    }

    if (period.count === best.count && period.sortKey > best.sortKey) {
      return period;
    }

    return best;
  }, null);
};

const toPeriodHighlight = (
  period: PeriodCount | null,
): AcquisitionPeriodHighlight | null =>
  period ? { label: period.label, count: period.count } : null;

export const calculateYearInReview = (
  releases: DiscogsRelease[],
  referenceDate = new Date(),
  timeframe: YearInReviewTimeframe = "year",
): YearInReviewSummary | null => {
  if (releases.length === 0) {
    return null;
  }

  const { recentStart, priorStart, priorEnd } = getPeriodBounds(
    timeframe,
    referenceDate,
  );
  let recentPeriodAdds = 0;
  let priorPeriodAdds = 0;
  const artistFirstAdded = new Map<string, Date>();
  const recentArtistCounts = new Map<string, number>();
  const recentGenreReleaseCounts = new Map<string, number>();
  const priorGenreReleaseCounts = new Map<string, number>();
  let recentGenreReleaseTotal = 0;
  let priorGenreReleaseTotal = 0;

  releases.forEach((release) => {
    const dateAdded = parseReleaseDateAdded(release);
    if (!dateAdded) {
      return;
    }

    if (isWithinRange(dateAdded, recentStart, referenceDate)) {
      recentPeriodAdds += 1;
    } else if (isWithinRange(dateAdded, priorStart, priorEnd)) {
      priorPeriodAdds += 1;
    }

    release.basic_information.artists.forEach((artist) => {
      const artistName = artist.name?.trim();
      if (!artistName) {
        return;
      }

      const existingFirstAdded = artistFirstAdded.get(artistName);
      if (!existingFirstAdded || dateAdded < existingFirstAdded) {
        artistFirstAdded.set(artistName, dateAdded);
      }

      if (isWithinRange(dateAdded, recentStart, referenceDate)) {
        recentArtistCounts.set(
          artistName,
          (recentArtistCounts.get(artistName) || 0) + 1,
        );
      }
    });

    const genres = release.basic_information.genres ?? [];
    if (genres.length === 0) {
      return;
    }

    const uniqueGenres = new Set<string>();
    genres.forEach((genre) => {
      const label = formatGenreLabel(genre);
      if (label) {
        uniqueGenres.add(label);
      }
    });

    if (isWithinRange(dateAdded, recentStart, referenceDate)) {
      recentGenreReleaseTotal += 1;
      uniqueGenres.forEach((label) => {
        recentGenreReleaseCounts.set(
          label,
          (recentGenreReleaseCounts.get(label) || 0) + 1,
        );
      });
    } else if (isWithinRange(dateAdded, priorStart, priorEnd)) {
      priorGenreReleaseTotal += 1;
      uniqueGenres.forEach((label) => {
        priorGenreReleaseCounts.set(
          label,
          (priorGenreReleaseCounts.get(label) || 0) + 1,
        );
      });
    }
  });

  const topNewArtists = Array.from(recentArtistCounts.entries())
    .filter(([artistName]) => {
      const firstAdded = artistFirstAdded.get(artistName);
      return firstAdded && firstAdded >= recentStart;
    })
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 3);

  const genreLabels = new Set([
    ...recentGenreReleaseCounts.keys(),
    ...priorGenreReleaseCounts.keys(),
  ]);

  const genreDrift = Array.from(genreLabels)
    .map((label) => {
      const recentCount = recentGenreReleaseCounts.get(label) || 0;
      const priorCount = priorGenreReleaseCounts.get(label) || 0;
      const recentShare =
        recentGenreReleaseTotal > 0
          ? (recentCount / recentGenreReleaseTotal) * 100
          : 0;
      const priorShare =
        priorGenreReleaseTotal > 0
          ? (priorCount / priorGenreReleaseTotal) * 100
          : 0;

      return {
        label,
        recentCount,
        priorCount,
        recentShare,
        priorShare,
        changePoints: recentShare - priorShare,
      };
    })
    .filter(
      (entry) =>
        entry.recentCount > 0 ||
        entry.priorCount > 0 ||
        Math.abs(entry.changePoints) >= 0.5,
    )
    .sort(
      (left, right) =>
        Math.abs(right.changePoints) - Math.abs(left.changePoints),
    )
    .slice(0, 3);

  const addsChangePercent =
    priorPeriodAdds > 0
      ? ((recentPeriodAdds - priorPeriodAdds) / priorPeriodAdds) * 100
      : null;

  return {
    recentPeriodAdds,
    priorPeriodAdds,
    addsChangePercent,
    topNewArtists,
    genreDrift,
  };
};

export const calculateAcquisitionStreaks = (
  releases: DiscogsRelease[],
): AcquisitionStreaksSummary | null => {
  if (releases.length === 0) {
    return null;
  }

  const addDays = new Set<number>();

  releases.forEach((release) => {
    const dateAdded = parseReleaseDateAdded(release);
    if (!dateAdded) {
      return;
    }

    addDays.add(startOfUtcDay(dateAdded).getTime());
  });

  const sortedAddDays = Array.from(addDays).sort((left, right) => left - right);

  let longestGapDays = 0;
  let longestGapStart: string | null = null;
  let longestGapEnd: string | null = null;

  for (let index = 1; index < sortedAddDays.length; index += 1) {
    const previousDay = sortedAddDays[index - 1];
    const currentDay = sortedAddDays[index];

    if (previousDay === undefined || currentDay === undefined) {
      continue;
    }

    const gapDays = Math.round((currentDay - previousDay) / MS_PER_DAY) - 1;

    if (gapDays > longestGapDays) {
      longestGapDays = gapDays;
      longestGapStart = formatMonthYear(new Date(previousDay));
      longestGapEnd = formatMonthYear(new Date(currentDay));
    }
  }

  const quarterCounts = new Map<string, PeriodCount>();
  const monthCounts = new Map<string, PeriodCount>();
  const dayCounts = new Map<string, PeriodCount>();

  releases.forEach((release) => {
    const dateAdded = parseReleaseDateAdded(release);
    if (!dateAdded) {
      return;
    }

    const dayStart = startOfUtcDay(dateAdded);
    const dayKey = dayStart.toISOString().slice(0, 10);
    const dayEntry = dayCounts.get(dayKey);

    if (dayEntry) {
      dayEntry.count += 1;
    } else {
      dayCounts.set(dayKey, {
        sortKey: dayKey,
        label: formatDayLabel(dayStart),
        count: 1,
      });
    }

    const monthKey = dayKey.slice(0, 7);
    const monthEntry = monthCounts.get(monthKey);

    if (monthEntry) {
      monthEntry.count += 1;
    } else {
      monthCounts.set(monthKey, {
        sortKey: monthKey,
        label: formatMonthYear(dayStart),
        count: 1,
      });
    }

    const { year, quarter } = getCalendarQuarter(dateAdded);
    const quarterKey = `${year}-Q${quarter}`;
    const quarterEntry = quarterCounts.get(quarterKey);

    if (quarterEntry) {
      quarterEntry.count += 1;
      return;
    }

    quarterCounts.set(quarterKey, {
      sortKey: quarterKey,
      label: formatQuarterLabel(year, quarter),
      count: 1,
    });
  });

  const quarterPeriods = Array.from(quarterCounts.values());
  const busiestQuarter = pickMaxPeriod(quarterPeriods);
  const leastBusyQuarter = pickMinPeriod(quarterPeriods);

  return {
    longestGapDays,
    longestGapStart,
    longestGapEnd,
    busiestDay: toPeriodHighlight(
      pickMaxPeriod(Array.from(dayCounts.values())),
    ),
    busiestMonth: toPeriodHighlight(
      pickMaxPeriod(Array.from(monthCounts.values())),
    ),
    busiestQuarter: toPeriodHighlight(busiestQuarter),
    leastBusyQuarter: toPeriodHighlight(leastBusyQuarter),
  };
};
