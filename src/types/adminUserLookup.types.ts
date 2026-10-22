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
  lastPlaylistUpdateAt: string | null;
  releasesAddedLast7Days: number;
  releasesAddedLast30Days: number;
}

export interface AdminUserLookupPreferences {
  theme: string;
  defaultView: string;
  defaultCollectionSidePanel: "crates" | "playlists";
  persistFilters: boolean;
  analyticsConsent: "enabled" | "disabled" | "unset";
  savedViewsCount: number;
}

export interface AdminUserLookupAnalytics {
  last7Days: number;
  last30Days: number;
  total: number;
}

export interface AdminUserLookupPlayback {
  trackRows: number;
  totalPlays: number;
  totalListens: number;
  tracksWithOverrides: number;
  lastPlayedAt: string | null;
  lastListenedAt: string | null;
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
    playlists: number;
    playlistTracks: number;
  };
  activity: AdminUserLookupActivity;
  analytics: AdminUserLookupAnalytics;
  playback: AdminUserLookupPlayback;
  crates: AdminUserLookupCrateSummary[];
}
