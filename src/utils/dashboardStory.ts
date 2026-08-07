import type { DiscogsRelease } from "src/types";
import type {
  CollectionAnalytics,
  DistributionData,
  FormatMixSummary,
  GrowthDataPoint,
} from "src/types/dashboard.types";
import { getOnThisDayReleases } from "src/utils/onThisDay";

export interface DashboardSectionCopy {
  title: string;
  lede: string;
}

export interface DashboardStorySections {
  today: DashboardSectionCopy;
  growth: DashboardSectionCopy;
  sound: DashboardSectionCopy;
  styleEvolution: DashboardSectionCopy;
  names: DashboardSectionCopy;
  markers: DashboardSectionCopy;
  share: DashboardSectionCopy;
  upkeep: DashboardSectionCopy;
}

export interface DashboardStory {
  heroEyebrow: string;
  heroTitle: string;
  heroCount: string;
  heroTagline: string | null;
  heroFallback: string | null;
  sections: DashboardStorySections;
}

const formatCount = (value: number): string =>
  new Intl.NumberFormat("en-US").format(value);

const joinWithAnd = (items: string[]): string => {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} & ${items[1]}`;
  }

  const last = items.at(-1);
  return `${items.slice(0, -1).join(", ")}, & ${last}`;
};

const topLabels = (distribution: DistributionData[], limit = 2): string[] =>
  distribution.slice(0, limit).map((entry) => entry.label);

const releasesAddedSince = (
  releases: DiscogsRelease[],
  since: Date,
): number => {
  let count = 0;

  releases.forEach((release) => {
    const dateAdded = new Date(release.date_added);
    if (!Number.isNaN(dateAdded.getTime()) && dateAdded >= since) {
      count += 1;
    }
  });

  return count;
};

const findBusiestMonth = (
  growth: GrowthDataPoint[],
): { label: string; count: number } | null => {
  if (growth.length === 0) {
    return null;
  }

  const busiest = growth.reduce<GrowthDataPoint | null>((best, point) => {
    if (!best || point.count > best.count) {
      return point;
    }

    return best;
  }, null);

  if (!busiest || busiest.count <= 0) {
    return null;
  }

  const parts = busiest.date.split("-");
  const year = parts[0];
  const month = parts[1];

  if (!(year && month)) {
    return { label: busiest.date, count: busiest.count };
  }

  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  const label = dateObj.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return { label, count: busiest.count };
};

const yearsCollecting = (releases: DiscogsRelease[]): number | null => {
  if (releases.length === 0) {
    return null;
  }

  const sortedByDate = [...releases].sort(
    (a, b) =>
      new Date(a.date_added).getTime() - new Date(b.date_added).getTime(),
  );
  const firstRelease = sortedByDate[0];

  if (!firstRelease) {
    return null;
  }

  const firstDate = new Date(firstRelease.date_added);
  if (Number.isNaN(firstDate.getTime())) {
    return null;
  }

  const today = new Date();
  return Math.max(
    0,
    Math.floor(
      (today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365),
    ),
  );
};

const buildHeroTagline = ({
  totalReleases,
  formatMix,
  styleDistribution,
  decadeDistribution,
  years,
}: {
  totalReleases: number;
  formatMix: FormatMixSummary | null;
  styleDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  years: number | null;
}): string | null => {
  if (totalReleases === 0) {
    return null;
  }

  const parts: string[] = [];

  if (formatMix && formatMix.topMediaTypePercent >= 45) {
    parts.push(`Mostly ${formatMix.topMediaType.toLowerCase()}`);
  }

  const styles = topLabels(styleDistribution, 2);
  if (styles.length > 0) {
    parts.push(joinWithAnd(styles));
  } else if (decadeDistribution[0]) {
    parts.push(decadeDistribution[0].label);
  }

  if (years !== null && years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"} collecting`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
};

export const buildDashboardStory = ({
  analytics,
  releases,
  username,
}: {
  analytics: CollectionAnalytics;
  releases: DiscogsRelease[];
  username?: string | null;
}): DashboardStory => {
  const {
    stats,
    growth,
    styleDistribution,
    decadeDistribution,
    artistDistribution,
    formatMix,
  } = analytics;
  const years = yearsCollecting(releases);
  const heroTitle = username ? `${username}'s collection` : "Your collection";
  const heroCount = formatCount(stats.totalReleases);
  const heroTagline = buildHeroTagline({
    totalReleases: stats.totalReleases,
    formatMix,
    styleDistribution,
    decadeDistribution,
    years,
  });
  const heroFallback =
    stats.totalReleases === 0
      ? "Add records to your shelf and this page will fill in."
      : null;

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const onThisDayCount = getOnThisDayReleases(releases).length;
  const todayLede =
    onThisDayCount > 0
      ? `${formatCount(onThisDayCount)} ${onThisDayCount === 1 ? "record" : "records"} added on ${dateString} in earlier years.`
      : `No records added on ${dateString} in earlier years yet.`;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const addedPastYear = releasesAddedSince(releases, oneYearAgo);
  const busiestMonth = findBusiestMonth(growth);
  let growthLede = "The full timeline of records added to your shelf.";

  if (addedPastYear > 0) {
    growthLede = `${formatCount(addedPastYear)} records added in the last year.`;
    if (busiestMonth && busiestMonth.count >= 3) {
      growthLede += ` Busiest month: ${busiestMonth.label} (${formatCount(busiestMonth.count)} records).`;
    }
  } else if (busiestMonth && busiestMonth.count >= 2) {
    growthLede = `Busiest month so far: ${busiestMonth.label}, with ${formatCount(busiestMonth.count)} records added.`;
  }

  const topStyle = styleDistribution[0];
  const soundLede = topStyle
    ? `${topStyle.label} leads with ${formatCount(topStyle.count)} records.`
    : "Styles, formats, and decades across your shelf.";

  const topArtist = artistDistribution[0];
  const namesLede = topArtist
    ? `${topArtist.label} appears ${formatCount(topArtist.count)} ${topArtist.count === 1 ? "time" : "times"}.`
    : "The artists and labels that repeat across your shelf.";

  const markersLede =
    years !== null && years > 0
      ? "First add, round numbers, and the years the shelf moved fastest."
      : "First records and round numbers will appear here as the shelf grows.";

  return {
    heroEyebrow: "Your shelf",
    heroTitle,
    heroCount,
    heroTagline,
    heroFallback,
    sections: {
      today: {
        title: "On this day",
        lede: todayLede,
      },
      growth: {
        title: "How it grew",
        lede: growthLede,
      },
      sound: {
        title: "What you collect",
        lede: soundLede,
      },
      styleEvolution: {
        title: "Taste over time",
        lede: "How your top styles shifted as you kept adding records.",
      },
      names: {
        title: "Who repeats",
        lede: namesLede,
      },
      markers: {
        title: "The path so far",
        lede: markersLede,
      },
      share: {
        title: "In your crates",
        lede: "Records that show up in more than one crate.",
      },
      upkeep: {
        title: "Shelf check",
        lede: "Duplicates, near-matches, and records still waiting for a rating.",
      },
    },
  };
};
