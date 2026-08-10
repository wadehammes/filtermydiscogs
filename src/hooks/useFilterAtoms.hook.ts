"use client";

import { useAtomValue, useSetAtom, useStore } from "jotai";
import { useCallback, useMemo } from "react";
import {
  allReleasesAtom,
  availableFormatsAtom,
  availableStylesAtom,
  availableYearsAtom,
  type FiltersActions,
  filteredReleasesAtom,
  filtersDispatchAtom,
  isPersistedFiltersAction,
  isRandomModeAtom,
  isSearchingAtom,
  persistedFiltersAtom,
  randomReleaseAtom,
  searchQueryAtom,
  selectedFormatsAtom,
  selectedSortAtom,
  selectedStylesAtom,
  selectedYearsAtom,
  styleOperatorAtom,
} from "src/atoms/filters.atoms";
import { useFiltersScope } from "src/context/filters.context";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import { getFilterPersistenceEnabled } from "src/utils/filterPersistence";
import { getAppliedFilterCount } from "src/utils/getAppliedFilterCount";
import { markFiltersPendingPersist } from "src/utils/userPreferencesSyncState";

export const useFiltersDispatch = () => {
  useFiltersScope();
  const store = useStore();
  const baseDispatch = useSetAtom(filtersDispatchAtom);
  const { persistPreferences } = usePersistUserPreferences();

  return useCallback(
    (action: FiltersActions) => {
      baseDispatch(action);

      if (
        !(isPersistedFiltersAction(action) && getFilterPersistenceEnabled())
      ) {
        return;
      }

      const nextFilters = store.get(persistedFiltersAtom);
      markFiltersPendingPersist(nextFilters);
      persistPreferences({ filters: nextFilters });
    },
    [baseDispatch, persistPreferences, store],
  );
};

export const useAllReleases = () => {
  useFiltersScope();

  return useAtomValue(allReleasesAtom);
};

export const useAvailableStyles = () => {
  useFiltersScope();

  return useAtomValue(availableStylesAtom);
};

export const useAvailableYears = () => {
  useFiltersScope();

  return useAtomValue(availableYearsAtom);
};

export const useAvailableFormats = () => {
  useFiltersScope();

  return useAtomValue(availableFormatsAtom);
};

export const useSelectedStyles = () => {
  useFiltersScope();

  return useAtomValue(selectedStylesAtom);
};

export const useSelectedYears = () => {
  useFiltersScope();

  return useAtomValue(selectedYearsAtom);
};

export const useSelectedFormats = () => {
  useFiltersScope();

  return useAtomValue(selectedFormatsAtom);
};

export const useSelectedSort = () => {
  useFiltersScope();

  return useAtomValue(selectedSortAtom);
};

export const useStyleOperator = () => {
  useFiltersScope();

  return useAtomValue(styleOperatorAtom);
};

export const useSearchQuery = () => {
  useFiltersScope();

  return useAtomValue(searchQueryAtom);
};

export const useIsSearching = () => {
  useFiltersScope();

  return useAtomValue(isSearchingAtom);
};

export const useIsRandomMode = () => {
  useFiltersScope();

  return useAtomValue(isRandomModeAtom);
};

export const useRandomRelease = () => {
  useFiltersScope();

  return useAtomValue(randomReleaseAtom);
};

export const useFilteredReleases = () => {
  useFiltersScope();

  return useAtomValue(filteredReleasesAtom);
};

export const useAppliedFilterCount = () => {
  useFiltersScope();
  const searchQuery = useAtomValue(searchQueryAtom);
  const selectedStyles = useAtomValue(selectedStylesAtom);
  const selectedYears = useAtomValue(selectedYearsAtom);
  const selectedFormats = useAtomValue(selectedFormatsAtom);

  return useMemo(
    () =>
      getAppliedFilterCount({
        searchQuery,
        selectedStyles,
        selectedYears,
        selectedFormats,
      }),
    [searchQuery, selectedFormats, selectedStyles, selectedYears],
  );
};
