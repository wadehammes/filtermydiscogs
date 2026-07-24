import { clearPersistedFilters } from "src/utils/filtersStorage";
import { clearPlaybackVideoIntroSeen } from "src/utils/playbackVideoIntroStorage";
import { clearPersistedReleasePlayback } from "src/utils/releasePlaybackStorage";

export const SELECTED_RELEASES_STORAGE_KEY =
  "filtermydiscogs_selected_releases";
export const USERNAME_STORAGE_KEY = "fmd_username";
export const THEME_STORAGE_KEY = "filtermydiscogs_theme";
export const VIEW_STATE_STORAGE_KEY = "filtermydiscogs_view_state";
export const LEGACY_COMMUNITY_RATINGS_STORAGE_KEY =
  "filtermydiscogs_community_ratings";

export const clearClientStoredData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SELECTED_RELEASES_STORAGE_KEY);
  localStorage.removeItem(USERNAME_STORAGE_KEY);
  localStorage.removeItem(THEME_STORAGE_KEY);
  localStorage.removeItem(VIEW_STATE_STORAGE_KEY);
  localStorage.removeItem(LEGACY_COMMUNITY_RATINGS_STORAGE_KEY);
  clearPersistedFilters();
  clearPersistedReleasePlayback();
  clearPlaybackVideoIntroSeen();
};
