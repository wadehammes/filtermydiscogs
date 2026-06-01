"use client";

import { useAtomValue, useSetAtom } from "jotai";
import {
  allReleasesAtom,
  availableFormatsAtom,
  availableStylesAtom,
  availableYearsAtom,
  type FiltersActions,
  filteredReleasesAtom,
  filtersDispatchAtom,
  isRandomModeAtom,
  isSearchingAtom,
  randomReleaseAtom,
  searchQueryAtom,
  selectedFormatsAtom,
  selectedSortAtom,
  selectedStylesAtom,
  selectedYearsAtom,
  styleOperatorAtom,
} from "src/atoms/filters.atoms";
import { useFiltersScope } from "src/context/filters.context";

export const useFiltersDispatch = () => {
  useFiltersScope();

  return useSetAtom(filtersDispatchAtom) as React.Dispatch<FiltersActions>;
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
