import type { PersistedFiltersJson } from "src/types/filters.types";
import type { ViewMode } from "src/types/view.types";
import type { FilterView } from "src/utils/filterViews";

export const USER_PREFERENCES_VERSION = 1;

export const DEFAULT_AUTO_PLAY_ON_QUEUE_ADD = true;
export const DEFAULT_EXTEND_QUEUE_WITH_SIMILAR_RELEASES = false;
export const DEFAULT_SQUARE_CORNERS = false;

export type CollectionSidePanelPreference = "crates" | "playlists";

export const DEFAULT_COLLECTION_SIDE_PANEL: CollectionSidePanelPreference =
  "crates";

export type PaletteTheme =
  | "amber"
  | "aurora"
  | "codex"
  | "dark"
  | "dim"
  | "discogs"
  | "ember"
  | "forest"
  | "futuristic"
  | "high-contrast"
  | "lavender"
  | "light"
  | "midnight"
  | "ocean"
  | "prism"
  | "sepia"
  | "slate"
  | "sunset"
  | "summer"
  | "terracotta"
  | "wine";

export type StoredTheme = PaletteTheme | "system";

export type StoredViewState = {
  currentView: ViewMode;
  previousView: ViewMode;
};

export type UserPreferencesJson = {
  version: typeof USER_PREFERENCES_VERSION;
  persistFilters: boolean;
  autoPlayOnQueueAdd: boolean;
  extendQueueWithSimilarReleases: boolean;
  defaultCollectionSidePanel: CollectionSidePanelPreference;
  theme: StoredTheme;
  squareCorners: boolean;
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
    | "extendQueueWithSimilarReleases"
    | "defaultCollectionSidePanel"
    | "theme"
    | "squareCorners"
    | "view"
    | "filters"
    | "filterViews"
    | "analyticsConsent"
  >
>;
