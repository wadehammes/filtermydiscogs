import { useCallback, useMemo } from "react";
import { trackEvent } from "src/analytics/analytics";
import {
  FiltersActionTypes,
  type SortValues,
  useFilters,
} from "src/context/filters.context";

export const useFilterHandlers = (category: string) => {
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const {
    availableStyles,
    availableYears,
    selectedStyles,
    selectedYears,
    selectedSort,
  } = filtersState;

  const handleStyleChange = useCallback(
    (value: string | string[]) => {
      const selectedOptions = Array.isArray(value) ? value : [value];

      trackEvent("releaseStyle", {
        action: "releaseStyleChanged",
        category,
        label: "Release Style Changed",
        value: selectedOptions.join(","),
      });

      filtersDispatch({
        type: FiltersActionTypes.SetStyles,
        payload: selectedOptions,
      });
    },
    [category, filtersDispatch],
  );

  const handleYearChange = useCallback(
    (value: string | string[]) => {
      const selectedOptions = Array.isArray(value) ? value : [value];
      const selectedYears = selectedOptions.map((year) => parseInt(year, 10));

      trackEvent("releaseYear", {
        action: "releaseYearChanged",
        category,
        label: "Release Year Changed",
        value: selectedYears.join(","),
      });

      filtersDispatch({
        type: FiltersActionTypes.SetYears,
        payload: selectedYears,
      });
    },
    [category, filtersDispatch],
  );

  const handleSortChange = useCallback(
    (value: string | string[]) => {
      const sortValue = Array.isArray(value) ? value[0] : value;

      if (sortValue) {
        trackEvent("releaseSort", {
          action: "releaseSortChanged",
          category,
          label: "Release Sort Changed",
          value: sortValue,
        });

        filtersDispatch({
          type: FiltersActionTypes.SetSort,
          payload: sortValue as SortValues,
        });
      }
    },
    [category, filtersDispatch],
  );

  const styleOptions = useMemo(
    () =>
      availableStyles.map((style) => ({
        value: style,
        label: style,
      })),
    [availableStyles],
  );

  const yearOptions = useMemo(
    () =>
      availableYears.map((year) => ({
        value: year.toString(),
        label: year.toString(),
      })),
    [availableYears],
  );

  return {
    handleStyleChange,
    handleYearChange,
    handleSortChange,
    styleOptions,
    yearOptions,
    selectedStyles,
    selectedYears,
    selectedSort,
  };
};
