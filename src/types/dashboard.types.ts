import type { DiscogsRelease } from "./discogs-release.types";

export interface CollectionValue {
  minimum: number;
  median: number;
  maximum: number;
}

export interface CollectionStats {
  totalReleases: number;
  uniqueArtists: number;
  uniqueLabels: number;
  averageRating: number;
  totalStyles: number;
  totalGenres: number;
}

export interface GrowthDataPoint {
  date: string;
  count: number;
  cumulative: number;
}

export interface YearInReviewArtistEntry {
  label: string;
  count: number;
}

export interface YearInReviewGenreDriftEntry {
  label: string;
  recentCount: number;
  priorCount: number;
  recentShare: number;
  priorShare: number;
  changePoints: number;
}

export interface YearInReviewSummary {
  recentPeriodAdds: number;
  priorPeriodAdds: number;
  addsChangePercent: number | null;
  topNewArtists: YearInReviewArtistEntry[];
  genreDrift: YearInReviewGenreDriftEntry[];
}

export interface AcquisitionPeriodHighlight {
  label: string;
  count: number;
}

export interface AcquisitionStreaksSummary {
  longestGapDays: number;
  longestGapStart: string | null;
  longestGapEnd: string | null;
  busiestDay: AcquisitionPeriodHighlight | null;
  busiestMonth: AcquisitionPeriodHighlight | null;
  busiestQuarter: AcquisitionPeriodHighlight | null;
  leastBusyQuarter: AcquisitionPeriodHighlight | null;
}

export interface DuplicateGroup {
  key: string;
  type: "master_id" | "title_artist";
  releases: DiscogsRelease[];
}

export interface DistributionData {
  label: string;
  value: number;
  count: number;
}

export interface FormatMixSummary {
  topMediaType: string;
  topMediaTypePercent: number;
  topTags: Array<{ label: string; count: number }>;
}

export interface CollectionHealth {
  duplicateCount: number;
  potentialDuplicates: number;
  releasesWithoutRating: number;
  duplicateGroups: DuplicateGroup[];
}

export interface MostCratedRelease {
  instance_id: string;
  crate_count: number;
  release: DiscogsRelease;
}

export interface AdminStatsTopUser {
  user_id: number;
  count: number;
}

export interface AdminStatsGrowthDataPoint {
  month: string;
  count: number;
}

export interface AdminStatsCrateFeatures {
  publicCrates: number;
  packedEnabledCrates: number;
  cratesWithNotes: number;
  totalSetMarkers: number;
  packedReleases: number;
}

export interface AdminStatsRecentActivityPeriod {
  newUsers: number;
  newCrates: number;
  newReleases: number;
  newPublicCrates: number;
  newSetMarkers: number;
  newPackedReleases: number;
}

export interface AdminStats {
  overview: {
    totalUsers: number;
    totalCrates: number;
    totalReleases: number;
    crateFeatures: AdminStatsCrateFeatures;
  };
  recentActivity: {
    last7Days: AdminStatsRecentActivityPeriod;
    last30Days: AdminStatsRecentActivityPeriod;
  };
  topUsers: {
    byCrates: AdminStatsTopUser[];
    byReleases: AdminStatsTopUser[];
  };
  growth: {
    users: AdminStatsGrowthDataPoint[];
    crates: AdminStatsGrowthDataPoint[];
    releases: AdminStatsGrowthDataPoint[];
    publicCrates: AdminStatsGrowthDataPoint[];
    setMarkers: AdminStatsGrowthDataPoint[];
  };
}

export interface CollectionMilestone {
  label: string;
  value: string;
  description?: string;
}

export interface StyleEvolutionData {
  period: string;
  styles: Array<{ name: string; count: number }>;
}

export interface CollectionAnalytics {
  stats: CollectionStats;
  growth: GrowthDataPoint[];
  health: CollectionHealth;
  yearInReview: YearInReviewSummary | null;
  acquisitionStreaks: AcquisitionStreaksSummary | null;
  styleDistribution: DistributionData[];
  genreDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  mediaTypeDistribution: DistributionData[];
  formatTagDistribution: DistributionData[];
  formatMix: FormatMixSummary | null;
  artistDistribution: DistributionData[];
  labelDistribution: DistributionData[];
  milestones: CollectionMilestone[];
  styleEvolution: StyleEvolutionData[];
}
