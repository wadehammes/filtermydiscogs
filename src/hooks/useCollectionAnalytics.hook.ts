import { useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { CollectionAnalytics } from "src/types/dashboard.types";
import {
  calculateArtistDistribution,
  calculateCollectionStats,
  calculateDecadeDistribution,
  calculateFormatMixSummary,
  calculateFormatTagDistribution,
  calculateLabelDistribution,
  calculateMediaFormatSubtypeBreakdown,
  calculateMediaTypeDistribution,
  calculateStyleDistribution,
  detectDuplicates,
} from "src/utils/collectionAnalytics";
import { analyzeGrowthFromDates } from "src/utils/growthTracker";
import { calculateMilestones } from "src/utils/milestones";
import { calculateStyleEvolution } from "src/utils/styleEvolution";

export const useCollectionAnalytics = (): CollectionAnalytics | null => {
  const releases = useAllReleases();

  return useMemo(() => {
    if (!releases || releases.length === 0) {
      return null;
    }

    const stats = calculateCollectionStats(releases);
    const duplicateGroups = detectDuplicates(releases);
    const releasesWithoutRating = releases.filter(
      (r) => !r.rating || r.rating === 0,
    ).length;

    const health = {
      duplicateCount: duplicateGroups.filter((g) => g.type === "master_id")
        .length,
      potentialDuplicates: duplicateGroups.filter(
        (g) => g.type === "title_artist",
      ).length,
      releasesWithoutRating,
      duplicateGroups,
    };

    const growth = analyzeGrowthFromDates(releases);
    const styleDistribution = calculateStyleDistribution(releases);
    const decadeDistribution = calculateDecadeDistribution(releases);
    const mediaTypeDistribution = calculateMediaTypeDistribution(releases);
    const formatTagDistribution = calculateFormatTagDistribution(releases);
    const mediaFormatSubtypeBreakdown =
      calculateMediaFormatSubtypeBreakdown(releases);
    const formatMix = calculateFormatMixSummary(releases);
    const artistDistribution = calculateArtistDistribution(releases);
    const labelDistribution = calculateLabelDistribution(releases);
    const milestones = calculateMilestones(releases);
    const styleEvolution = calculateStyleEvolution(releases);

    return {
      stats,
      growth,
      health,
      styleDistribution,
      decadeDistribution,
      mediaTypeDistribution,
      formatTagDistribution,
      mediaFormatSubtypeBreakdown,
      formatMix,
      artistDistribution,
      labelDistribution,
      milestones,
      styleEvolution,
    };
  }, [releases]);
};
