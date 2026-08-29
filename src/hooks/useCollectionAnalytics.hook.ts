import { useDeferredValue, useMemo } from "react";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
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

export const useCollectionAnalytics = (): CollectionAnalytics | null => {
  const releases = useAllReleases();
  const deferredReleases = useDeferredValue(releases);
  const analyticsReleases =
    releases.length === 0
      ? releases
      : deferredReleases.length > 0
        ? deferredReleases
        : releases;

  return useMemo(() => {
    if (!analyticsReleases || analyticsReleases.length === 0) {
      return null;
    }

    const stats = calculateCollectionStats(analyticsReleases);
    const duplicateGroups = detectDuplicates(analyticsReleases);
    const releasesWithoutRating = analyticsReleases.filter(
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

    const growth = analyzeGrowthFromDates(analyticsReleases);
    const acquisitionStreaks = calculateAcquisitionStreaks(analyticsReleases);
    const styleDistribution = calculateStyleDistribution(analyticsReleases);
    const genreDistribution = calculateGenreDistribution(analyticsReleases);
    const decadeDistribution = calculateDecadeDistribution(analyticsReleases);
    const mediaTypeDistribution =
      calculateMediaTypeDistribution(analyticsReleases);
    const formatTagDistribution =
      calculateFormatTagDistribution(analyticsReleases);
    const formatMix = calculateFormatMixSummary(analyticsReleases);
    const artistDistribution = calculateArtistDistribution(analyticsReleases);
    const labelDistribution = calculateLabelDistribution(analyticsReleases);
    const milestones = calculateMilestones(analyticsReleases);
    const styleEvolution = calculateStyleEvolution(analyticsReleases);

    return {
      stats,
      growth,
      health,
      acquisitionStreaks,
      styleDistribution,
      genreDistribution,
      decadeDistribution,
      mediaTypeDistribution,
      formatTagDistribution,
      formatMix,
      artistDistribution,
      labelDistribution,
      milestones,
      styleEvolution,
    };
  }, [analyticsReleases]);
};
