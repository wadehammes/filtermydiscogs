export interface AdminUserLookupCrateSummary {
  id: string;
  name: string;
  releaseCount: number;
  markerCount: number;
  private: boolean;
  packedEnabled: boolean;
  hasNotes: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserLookupActivity {
  lastCrateUpdateAt: string | null;
  lastReleaseAddedAt: string | null;
  releasesAddedLast7Days: number;
  releasesAddedLast30Days: number;
}

export interface AdminUserLookupPreferences {
  theme: string;
  defaultView: string;
  persistFilters: boolean;
  analyticsConsent: "enabled" | "disabled" | "unset";
}

export interface AdminUserLookupAnalytics {
  last7Days: number;
  last30Days: number;
  total: number;
}

export interface AdminUserLookupStats {
  user: {
    discogsUserId: number;
    username: string;
    createdAt: string;
    updatedAt: string;
  };
  preferences: AdminUserLookupPreferences;
  totals: {
    crates: number;
    releases: number;
    publicCrates: number;
    packedEnabledCrates: number;
    cratesWithNotes: number;
    setMarkers: number;
    packedReleases: number;
  };
  activity: AdminUserLookupActivity;
  analytics: AdminUserLookupAnalytics;
  crates: AdminUserLookupCrateSummary[];
}
