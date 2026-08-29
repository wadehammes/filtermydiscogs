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

  return useMemo(() => {
    if (!deferredReleases || deferredReleases.length === 0) {
      return null;
    }

    const stats = calculateCollectionStats(deferredReleases);
    const duplicateGroups = detectDuplicates(deferredReleases);
    const releasesWithoutRating = deferredReleases.filter(
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

    const growth = analyzeGrowthFromDates(deferredReleases);
    const acquisitionStreaks = calculateAcquisitionStreaks(deferredReleases);
    const styleDistribution = calculateStyleDistribution(deferredReleases);
    const genreDistribution = calculateGenreDistribution(deferredReleases);
    const decadeDistribution = calculateDecadeDistribution(deferredReleases);
    const mediaTypeDistribution =
      calculateMediaTypeDistribution(deferredReleases);
    const formatTagDistribution =
      calculateFormatTagDistribution(deferredReleases);
    const formatMix = calculateFormatMixSummary(deferredReleases);
    const artistDistribution = calculateArtistDistribution(deferredReleases);
    const labelDistribution = calculateLabelDistribution(deferredReleases);
    const milestones = calculateMilestones(deferredReleases);
    const styleEvolution = calculateStyleEvolution(deferredReleases);

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
  }, [deferredReleases]);
};
