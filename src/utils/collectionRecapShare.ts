import type { YearInReviewSummary } from "src/types/dashboard.types";
import { getSiteUrl } from "src/utils/helpers";
import { formatWeeklyRecapChangePercent } from "src/utils/weeklyRecap";

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

export const getCollectionRecapHighlight = (
  summary: YearInReviewSummary,
  recentPeriodLabel: string,
): string | null => {
  const topGenre = [...summary.genreDrift]
    .filter((entry) => entry.recentCount > 0)
    .sort((left, right) => right.recentCount - left.recentCount)[0];

  if (topGenre) {
    return `${topGenre.label} led your adds`;
  }

  const topArtist = summary.topNewArtists[0];
  const periodHint = recentPeriodLabel.toLowerCase();
  if (topArtist) {
    return `${topArtist.label} ${topArtist.count === 1 ? "is new" : `× ${formatCount(topArtist.count)}`} ${periodHint}`;
  }

  return null;
};

export interface BuildCollectionRecapShareTextInput {
  compareLabel: string;
  periodEyebrow: string;
  recentPeriodLabel: string;
  summary: YearInReviewSummary;
  totalReleases: number;
  username: string;
}

export const buildCollectionRecapShareText = ({
  compareLabel,
  periodEyebrow,
  recentPeriodLabel,
  summary,
  totalReleases,
  username,
}: BuildCollectionRecapShareTextInput): string => {
  const lines: string[] = [
    `${username}'s shelf — ${periodEyebrow.toLowerCase()}`,
    `${formatCount(summary.recentPeriodAdds)} records added (${formatCount(totalReleases)} total on the shelf)`,
  ];

  const changeLabel = formatWeeklyRecapChangePercent(summary.addsChangePercent);
  if (changeLabel) {
    lines.push(`${changeLabel} ${compareLabel}`);
  }

  const highlight = getCollectionRecapHighlight(summary, recentPeriodLabel);
  if (highlight) {
    lines.push(highlight);
  }

  const topArtists = summary.topNewArtists.slice(0, 3);
  if (topArtists.length > 0) {
    const artistLine = topArtists
      .map((entry) =>
        entry.count > 1
          ? `${entry.label} (${formatCount(entry.count)})`
          : entry.label,
      )
      .join(", ");
    lines.push(`New on the shelf: ${artistLine}`);
  }

  const siteHost = new URL(getSiteUrl()).host;
  lines.push(siteHost);

  return lines.join("\n");
};
