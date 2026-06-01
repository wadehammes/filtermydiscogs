"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { createContext, type PropsWithChildren, useContext } from "react";
import {
  type FiltersActions,
  filtersDispatchAtom,
  filtersStateAtom,
  sortedFilteredReleasesAtom,
} from "src/atoms/filters.atoms";

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

export const FiltersProvider = ({ children }: PropsWithChildren) => (
  <FiltersScopeContext.Provider value={true}>
    {children}
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
