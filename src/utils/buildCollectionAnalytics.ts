import type { DiscogsRelease } from "src/types";
import type { CollectionAnalytics } from "src/types/dashboard.types";
import {
  calculateArtistDistribution,
  calculateCollectionStats,
  calculateDecadeDistribution,
  calculateFormatMixSummary,
  calculateFormatTagDistribution,
  calculateGenreDistribution,
  calculateLabelDistribution,
  calculateMediaTypeDistribution,
  calculateStyleDistribution,
  detectDuplicates,
} from "src/utils/collectionAnalytics";
import { calculateAcquisitionStreaks } from "src/utils/collectionRhythm";
import { analyzeGrowthFromDates } from "src/utils/growthTracker";
import { calculateMilestones } from "src/utils/milestones";
import { calculateStyleEvolution } from "src/utils/styleEvolution";

export type CollectionAnalyticsCore = Pick<
  CollectionAnalytics,
  "stats" | "growth" | "acquisitionStreaks"
>;

export type CollectionAnalyticsHeavySections = Omit<
  CollectionAnalytics,
  keyof CollectionAnalyticsCore
>;

export const buildCollectionAnalyticsCore = (
  releases: readonly DiscogsRelease[],
): CollectionAnalyticsCore => ({
  stats: calculateCollectionStats(releases),
  growth: analyzeGrowthFromDates(releases),
  acquisitionStreaks: calculateAcquisitionStreaks(releases),
});

export const emptyCollectionAnalyticsHeavySections =
  (): CollectionAnalyticsHeavySections => ({
    health: {
      duplicateCount: 0,
      potentialDuplicates: 0,
      releasesWithoutRating: 0,
      duplicateGroups: [],
    },
    styleDistribution: [],
    genreDistribution: [],
    decadeDistribution: [],
    mediaTypeDistribution: [],
    formatTagDistribution: [],
    formatMix: null,
    artistDistribution: [],
    labelDistribution: [],
    milestones: [],
    styleEvolution: [],
  });

export const buildCollectionAnalyticsHeavy = (
  releases: readonly DiscogsRelease[],
): CollectionAnalyticsHeavySections => {
  const duplicateGroups = detectDuplicates(releases);
  const releasesWithoutRating = releases.filter(
    (r) => !r.rating || r.rating === 0,
  ).length;

  return {
    health: {
      duplicateCount: duplicateGroups.filter((g) => g.type === "master_id")
        .length,
      potentialDuplicates: duplicateGroups.filter(
        (g) => g.type === "title_artist",
      ).length,
      releasesWithoutRating,
      duplicateGroups,
    },
    styleDistribution: calculateStyleDistribution(releases),
    genreDistribution: calculateGenreDistribution(releases),
    decadeDistribution: calculateDecadeDistribution(releases),
    mediaTypeDistribution: calculateMediaTypeDistribution(releases),
    formatTagDistribution: calculateFormatTagDistribution(releases),
    formatMix: calculateFormatMixSummary(releases),
    artistDistribution: calculateArtistDistribution(releases),
    labelDistribution: calculateLabelDistribution(releases),
    milestones: calculateMilestones(releases),
    styleEvolution: calculateStyleEvolution(releases),
  };
};

export const buildCollectionAnalytics = (
  releases: readonly DiscogsRelease[],
): CollectionAnalytics => ({
  ...buildCollectionAnalyticsCore(releases),
  ...buildCollectionAnalyticsHeavy(releases),
});

export const buildCollectionAnalyticsDuringTransition = (
  releases: readonly DiscogsRelease[],
): CollectionAnalytics => ({
  ...buildCollectionAnalyticsCore(releases),
  ...emptyCollectionAnalyticsHeavySections(),
});
