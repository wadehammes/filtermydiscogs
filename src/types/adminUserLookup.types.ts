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

export interface AdminUserLookupPlaylistSummary {
  id: string;
  name: string;
  trackCount: number;
  private: boolean;
  publicViewCount: number;
  publicPlayCount: number;
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
  autoPlayOnQueueAdd: boolean;
  extendQueueWithSimilarReleases: boolean;
  analyticsConsent: "enabled" | "disabled" | "unset";
  savedViewsCount: number;
}

export interface AdminUserLookupPlayback {
  trackRows: number;
  totalPlays: number;
  totalListens: number;
  tracksWithOverrides: number;
  lastPlayedAt: string | null;
  lastListenedAt: string | null;
}

export interface AdminUserLookupContact {
  email: string | null;
  marketingEmailsOptIn: boolean;
  welcomeEmailSent: boolean;
}

export interface AdminUserLookupStats {
  user: {
    discogsUserId: number;
    username: string;
    createdAt: string;
    updatedAt: string;
    lastSeenAt: string | null;
    loginCount: number;
  };
  contact: AdminUserLookupContact;
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
  playback: AdminUserLookupPlayback;
  crates: AdminUserLookupCrateSummary[];
  playlists: AdminUserLookupPlaylistSummary[];
}
