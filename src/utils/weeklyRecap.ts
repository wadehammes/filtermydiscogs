import type { DiscogsRelease } from "src/types";
import type { YearInReviewSummary } from "src/types/dashboard.types";
import { calculateYearInReview } from "src/utils/collectionRhythm";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const WEEK_MS = 7 * MS_PER_DAY;

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const parseReleaseDateAdded = (release: DiscogsRelease): Date | null => {
  const dateAdded = new Date(release.date_added);
  if (Number.isNaN(dateAdded.getTime())) {
    return null;
  }

  return dateAdded;
};

export const getWeeklyRecapReleases = (
  releases: DiscogsRelease[],
  referenceDate = new Date(),
): DiscogsRelease[] => {
  const recentStart = new Date(referenceDate.getTime() - WEEK_MS);

  return releases
    .filter((release) => {
      const dateAdded = parseReleaseDateAdded(release);
      if (!dateAdded) {
        return false;
      }

      return dateAdded >= recentStart && dateAdded < referenceDate;
    })
    .sort(
      (left, right) =>
        new Date(right.date_added).getTime() -
        new Date(left.date_added).getTime(),
    );
};

export const calculateWeeklyRecapSummary = (
  releases: DiscogsRelease[],
  referenceDate = new Date(),
): YearInReviewSummary | null =>
  calculateYearInReview(releases, referenceDate, "week");

export const buildWeeklyRecapLede = (
  summary: YearInReviewSummary | null,
): string => {
  if (!summary) {
    return "Your last 7 days at a glance.";
  }

  const { recentPeriodAdds, priorPeriodAdds, addsChangePercent } = summary;

  if (recentPeriodAdds > 0) {
    let lede = `${formatCount(recentPeriodAdds)} ${recentPeriodAdds === 1 ? "record" : "records"} added in the last 7 days.`;

    if (priorPeriodAdds > 0 && addsChangePercent !== null) {
      const rounded = Math.abs(addsChangePercent).toFixed(
        Math.abs(addsChangePercent) >= 10 ? 0 : 1,
      );

      if (addsChangePercent > 0) {
        lede += ` Up ${rounded}% vs the prior week.`;
      } else if (addsChangePercent < 0) {
        lede += ` Down ${rounded}% vs the prior week.`;
      }
    } else if (priorPeriodAdds === 0) {
      lede += " Nothing added the week before.";
    }

    return lede;
  }

  if (priorPeriodAdds > 0) {
    return `No records added in the last 7 days. Prior week: ${formatCount(priorPeriodAdds)}.`;
  }

  return "No records added in the last two weeks.";
};

export const formatWeeklyRecapChangePercent = (
  value: number | null,
): string | null => {
  if (value === null || Math.abs(value) < 0.5) {
    return null;
  }

  const rounded = Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1);
  const prefix = value > 0 ? "+" : "-";
  return `${prefix}${rounded}%`;
};

export const getWeeklyRecapHighlight = (
  summary: YearInReviewSummary,
): string | null => {
  const topGenre = [...summary.genreDrift]
    .filter((entry) => entry.recentCount > 0)
    .sort((left, right) => right.recentCount - left.recentCount)[0];

  if (topGenre) {
    return `${topGenre.label} led your adds`;
  }

  const topArtist = summary.topNewArtists[0];
  if (topArtist) {
    return `${topArtist.label} ${topArtist.count === 1 ? "is new" : `× ${formatCount(topArtist.count)}`} this week`;
  }

  return null;
};
