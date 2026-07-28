import type { PersistedFiltersState } from "src/types/filters.types";
import type { StoredViewState } from "src/types/userPreferences.types";
import { persistedFiltersEqual } from "src/utils/filtersStorage";

let pendingFilterPersist: PersistedFiltersState | null = null;

export const markFiltersPendingPersist = (
  filters: PersistedFiltersState,
): void => {
  pendingFilterPersist = filters;
};

export const consumePendingFilterPersist = (
  filters: PersistedFiltersState,
): boolean => {
  if (
    pendingFilterPersist === null ||
    !persistedFiltersEqual(pendingFilterPersist, filters)
  ) {
    return false;
  }

  pendingFilterPersist = null;
  return true;
};

export const viewStateMatches = (
  left: StoredViewState,
  right: StoredViewState,
): boolean =>
  left.currentView === right.currentView &&
  left.previousView === right.previousView;
