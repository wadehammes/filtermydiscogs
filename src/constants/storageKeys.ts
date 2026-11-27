export const SELECTED_RELEASES_STORAGE_KEY =
  "filtermydiscogs_selected_releases";
export const USERNAME_STORAGE_KEY = "fmd_username";
export const THEME_STORAGE_KEY = "filtermydiscogs_theme";
export const VIEW_STATE_STORAGE_KEY = "filtermydiscogs_view_state";
export const VIEW_STATE_COOKIE_NAME = "filtermydiscogs_view";
export const FILTERS_STORAGE_KEY = "filtermydiscogs_filters";
export const LEGACY_COMMUNITY_RATINGS_STORAGE_KEY =
  "filtermydiscogs_community_ratings";
export const ANALYTICS_CONSENT_STORAGE_KEY =
  "filtermydiscogs_analytics_consent";
export const RELEASES_TABLE_LAYOUT_STORAGE_KEY =
  "filtermydiscogs_releases_table_layout";
export const COLLECTION_ITEM_COUNTS_STORAGE_KEY =
  "filtermydiscogs_collection_item_counts";
export const SIMILAR_PAGE_INDEX_SESSION_KEY =
  "fmd:similar-page-index-by-anchor";
export const PLAYBACK_DOCK_VOLUME_STORAGE_KEY =
  "filtermydiscogs_playback_dock_volume";
export const COLLECTION_COMMAND_PROMPTS_STORAGE_KEY =
  "filtermydiscogs_collection_command_prompts";

export const buildCollectionCommandPromptsStorageKey = (
  userId: string,
): string => `${COLLECTION_COMMAND_PROMPTS_STORAGE_KEY}_${userId}`;

export const buildEmailAccountToastDismissedStorageKey = (
  userId: string,
): string => `fmd_email_account_toast_dismissed_${userId}`;

export const COLLECTION_CACHE_DB_NAME = "filtermydiscogs";
export const COLLECTION_CACHE_STORE_NAME = "collection_cache";
