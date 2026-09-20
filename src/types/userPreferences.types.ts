import type { PersistedFiltersJson } from "src/types/filters.types";
import type { ViewMode } from "src/types/view.types";
import type { FilterView } from "src/utils/filterViews";

export const USER_PREFERENCES_VERSION = 1;

export const DEFAULT_AUTO_PLAY_ON_QUEUE_ADD = true;
export const DEFAULT_EXTEND_QUEUE_WITH_SIMILAR_RELEASES = false;

export type PaletteTheme =
  | "amber"
  | "codex"
  | "dark"
  | "dim"
  | "discogs"
  | "forest"
  | "futuristic"
  | "high-contrast"
  | "light"
  | "midnight"
  | "sepia"
  | "slate"
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
    | "extendQueueWithSimilarReleases"
    | "theme"
    | "view"
    | "filters"
    | "filterViews"
    | "analyticsConsent"
  >
>;
