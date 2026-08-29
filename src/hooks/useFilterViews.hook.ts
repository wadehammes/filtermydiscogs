"use client";

import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { trackEvent } from "src/analytics/analytics";
import {
  FiltersActionTypes,
  sessionFiltersAtom,
} from "src/atoms/filters.atoms";
import { useAuth } from "src/context/auth.context";
import { useUserPreferencesQuery } from "src/hooks/queries/useUserPreferencesQuery";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import {
  createFilterView,
  type FilterView,
  filterViewNameExists,
  findMatchingFilterView,
  hasSaveableFilterViewFilters,
  isValidFilterViewName,
  MAX_FILTER_VIEWS,
  normalizeFilterViewName,
  renameFilterView,
} from "src/utils/filterViews";
import { getAppliedFilterCount } from "src/utils/getAppliedFilterCount";

const FILTER_VIEW_SAVED_MESSAGE = "View saved";
const FILTER_VIEW_SAVE_ERROR_MESSAGE = "Failed to save view";
const FILTER_VIEW_RENAMED_MESSAGE = "View renamed";
const FILTER_VIEW_RENAME_ERROR_MESSAGE = "Failed to rename view";
const FILTER_VIEW_DELETED_MESSAGE = "View deleted";
const FILTER_VIEW_DELETE_ERROR_MESSAGE = "Failed to delete view";

export const useFilterViews = () => {
  const { state: authState } = useAuth();
  const sessionFilters = useAtomValue(sessionFiltersAtom);
  const filtersDispatch = useFiltersDispatch();
  const { persistPreferences, isPending: isSavingPreferences } =
    usePersistUserPreferences();

  const { data: preferences } = useUserPreferencesQuery({
    userId: authState.userId,
    enabled: authState.isAuthenticated && !authState.isCheckingAuth,
  });

  const filterViews = useMemo(
    () => preferences?.filterViews ?? [],
    [preferences?.filterViews],
  );

  const matchingView = useMemo(
    () => findMatchingFilterView(filterViews, sessionFilters),
    [filterViews, sessionFilters],
  );

  const canSaveCurrentView =
    hasSaveableFilterViewFilters(sessionFilters) && matchingView === null;
  const canAddView = filterViews.length < MAX_FILTER_VIEWS;
  const hasActiveFilters = getAppliedFilterCount(sessionFilters) > 0;

  const persistFilterViews = useCallback(
    (
      nextViews: FilterView[],
      {
        onSuccess,
        errorMessage,
      }: { onSuccess: () => void; errorMessage: string },
    ) => {
      persistPreferences(
        { filterViews: nextViews },
        {
          onSuccess,
          onError: () => {
            toast.error(errorMessage);
          },
        },
      );
    },
    [persistPreferences],
  );

  const applyView = useCallback(
    (view: FilterView) => {
      filtersDispatch({
        type: FiltersActionTypes.ApplySessionFilters,
        payload: { ...view.filters },
      });
      trackEvent("filterViewApplied", {
        action: "applyFilterView",
        category: "filters",
        label: view.name,
        value: view.id,
      });
    },
    [filtersDispatch],
  );

  const resetFilters = useCallback(() => {
    filtersDispatch({
      type: FiltersActionTypes.ClearAllFilters,
      payload: undefined,
    });
    trackEvent("filtersCleared", {
      action: "clearAllFilters",
      category: "filters",
      label: "Reset Filters",
      value: "filterViewsMenu",
    });
  }, [filtersDispatch]);

  const saveCurrentView = useCallback(
    (name: string) => {
      const normalizedName = normalizeFilterViewName(name);

      if (!isValidFilterViewName(normalizedName)) {
        return false;
      }

      if (!canSaveCurrentView) {
        toast.error("Adjust filters before saving a view.");
        return false;
      }

      if (!canAddView) {
        toast.error(`You can save up to ${MAX_FILTER_VIEWS} views.`);
        return false;
      }

      if (filterViewNameExists(filterViews, normalizedName)) {
        toast.error("A view with that name already exists.");
        return false;
      }

      const nextViews = [
        createFilterView(normalizedName, sessionFilters),
        ...filterViews,
      ];

      persistFilterViews(nextViews, {
        onSuccess: () => {
          toast.success(FILTER_VIEW_SAVED_MESSAGE);
          trackEvent("filterViewSaved", {
            action: "saveFilterView",
            category: "filters",
            label: normalizedName,
            value: String(nextViews.length),
          });
        },
        errorMessage: FILTER_VIEW_SAVE_ERROR_MESSAGE,
      });

      return true;
    },
    [
      canAddView,
      canSaveCurrentView,
      filterViews,
      persistFilterViews,
      sessionFilters,
    ],
  );

  const deleteView = useCallback(
    (viewId: string) => {
      const nextViews = filterViews.filter((view) => view.id !== viewId);

      if (nextViews.length === filterViews.length) {
        return;
      }

      persistFilterViews(nextViews, {
        onSuccess: () => {
          toast.success(FILTER_VIEW_DELETED_MESSAGE);
        },
        errorMessage: FILTER_VIEW_DELETE_ERROR_MESSAGE,
      });
    },
    [filterViews, persistFilterViews],
  );

  const renameView = useCallback(
    (viewId: string, name: string) => {
      const normalizedName = normalizeFilterViewName(name);

      if (!isValidFilterViewName(normalizedName)) {
        return false;
      }

      const nextViews = renameFilterView(filterViews, viewId, normalizedName);

      if (!nextViews) {
        if (filterViewNameExists(filterViews, normalizedName, viewId)) {
          toast.error("A view with that name already exists.");
        }

        return false;
      }

      if (nextViews === filterViews) {
        return true;
      }

      persistFilterViews(nextViews, {
        onSuccess: () => {
          toast.success(FILTER_VIEW_RENAMED_MESSAGE);
          trackEvent("filterViewRenamed", {
            action: "renameFilterView",
            category: "filters",
            label: normalizedName,
            value: viewId,
          });
        },
        errorMessage: FILTER_VIEW_RENAME_ERROR_MESSAGE,
      });

      return true;
    },
    [filterViews, persistFilterViews],
  );

  return {
    filterViews,
    matchingView,
    canSaveCurrentView,
    canAddView,
    hasActiveFilters,
    isSavingPreferences,
    applyView,
    resetFilters,
    saveCurrentView,
    deleteView,
    renameView,
  };
};
