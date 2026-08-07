import {
  LEGACY_COMMUNITY_RATINGS_STORAGE_KEY,
  RELEASES_TABLE_LAYOUT_STORAGE_KEY,
  SELECTED_RELEASES_STORAGE_KEY,
  THEME_STORAGE_KEY,
  USERNAME_STORAGE_KEY,
  VIEW_STATE_STORAGE_KEY,
} from "src/constants/storageKeys";
import { clearAnalyticsConsentChoice } from "src/utils/analyticsConsentStorage";
import {
  PERSIST_FILTERS_STORAGE_KEY,
  resetFilterPersistenceCache,
} from "src/utils/filterPersistence";
import { clearPersistedFilters } from "src/utils/filtersStorage";
import { clearPlaybackVideoIntroSeen } from "src/utils/playbackVideoIntroStorage";
import { clearPersistedReleasePlayback } from "src/utils/releasePlaybackStorage";

export const clearClientStoredData = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SELECTED_RELEASES_STORAGE_KEY);
  localStorage.removeItem(USERNAME_STORAGE_KEY);
  localStorage.removeItem(THEME_STORAGE_KEY);
  localStorage.removeItem(VIEW_STATE_STORAGE_KEY);
  localStorage.removeItem(RELEASES_TABLE_LAYOUT_STORAGE_KEY);
  localStorage.removeItem(LEGACY_COMMUNITY_RATINGS_STORAGE_KEY);
  localStorage.removeItem(PERSIST_FILTERS_STORAGE_KEY);
  resetFilterPersistenceCache();
  clearPersistedFilters();
  clearPersistedReleasePlayback();
  clearPlaybackVideoIntroSeen();
  clearAnalyticsConsentChoice();
};
