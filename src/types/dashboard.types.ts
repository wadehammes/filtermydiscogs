import type { DiscogsRelease } from "./index";

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
  styleDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  formatDistribution: DistributionData[];
  artistDistribution: DistributionData[];
  labelDistribution: DistributionData[];
  milestones: CollectionMilestone[];
  styleEvolution: StyleEvolutionData[];
}
