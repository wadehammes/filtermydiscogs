import type { PersistedFiltersJson } from "src/types/filters.types";
import type { ViewMode } from "src/types/view.types";
import type { FilterView } from "src/utils/filterViews";

export const USER_PREFERENCES_VERSION = 1;

export const DEFAULT_AUTO_PLAY_ON_QUEUE_ADD = true;
export const DEFAULT_SHOW_DJ_METADATA_ON_TRACKS = false;

export type PaletteTheme =
  | "light"
  | "dim"
  | "dark"
  | "sepia"
  | "forest"
  | "amber"
  | "slate"
  | "midnight"
  | "codex"
  | "discogs"
  | "wine"
  | "high-contrast"
  | "futuristic";

export type StoredTheme = PaletteTheme | "system";

export type StoredViewState = {
  currentView: ViewMode;
  previousView: ViewMode;
};

export type UserPreferencesJson = {
  version: typeof USER_PREFERENCES_VERSION;
  persistFilters: boolean;
  autoPlayOnQueueAdd: boolean;
  showDjMetadataOnTracks: boolean;
  theme: StoredTheme;
  view: StoredViewState;
  filters: PersistedFiltersJson;
  filterViews: FilterView[];
  analyticsConsent?: boolean;
};

export type UserPreferences = UserPreferencesJson;

export type UserPreferencesPatch = Partial<
  Pick<
    UserPreferences,
    | "persistFilters"
    | "autoPlayOnQueueAdd"
    | "showDjMetadataOnTracks"
    | "theme"
    | "view"
    | "filters"
    | "filterViews"
    | "analyticsConsent"
  >
>;
