import { useMemo } from "react";
import { useCollectionContext } from "src/context/collection.context";
import type { CollectionAnalytics } from "src/types/dashboard.types";
import {
  calculateArtistDistribution,
  calculateCollectionStats,
  calculateDecadeDistribution,
  calculateFormatDistribution,
  calculateLabelDistribution,
  calculateStyleDistribution,
  detectDuplicates,
} from "src/utils/collectionAnalytics";
import { analyzeGrowthFromDates } from "src/utils/growthTracker";
import { calculateMilestones } from "src/utils/milestones";
import { calculateStyleEvolution } from "src/utils/styleEvolution";

export const useCollectionAnalytics = (): CollectionAnalytics | null => {
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;

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
    const formatDistribution = calculateFormatDistribution(releases);
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
      formatDistribution,
      artistDistribution,
      labelDistribution,
      milestones,
      styleEvolution,
    };
  }, [releases]);
};
