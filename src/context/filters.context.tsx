"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { createContext, type PropsWithChildren, useContext } from "react";
import {
  type FiltersActions,
  filtersDispatchAtom,
  filtersStateAtom,
  sortedFilteredReleasesAtom,
} from "src/atoms/filters.atoms";
import { useInitializePendingFiltersRestore } from "src/hooks/useInitializePendingFiltersRestore.hook";

export {
  type FiltersActions,
  FiltersActionTypes,
  type FiltersState,
  SortValues,
  type StyleOperator,
} from "src/atoms/filters.atoms";

const FiltersScopeContext = createContext(false);

export const useFiltersScope = () => {
  const inProvider = useContext(FiltersScopeContext);
  if (!inProvider) {
    throw new Error("useFilters must be used within a FiltersProvider");
  }
};

const FiltersProviderInner = ({ children }: PropsWithChildren) => {
  useInitializePendingFiltersRestore();

  return children;
};

export const FiltersProvider = ({ children }: PropsWithChildren) => (
  <FiltersScopeContext.Provider value={true}>
    <FiltersProviderInner>{children}</FiltersProviderInner>
  </FiltersScopeContext.Provider>
);

export const useFilters = () => {
  useFiltersScope();

  const state = useAtomValue(filtersStateAtom);
  const dispatch = useSetAtom(filtersDispatchAtom);

  return { state, dispatch: dispatch as React.Dispatch<FiltersActions> };
};

export const useMemoizedFilteredReleases = () => {
  useFiltersScope();

  return useAtomValue(sortedFilteredReleasesAtom);
};
