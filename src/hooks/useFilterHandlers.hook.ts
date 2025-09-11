import { trackEvent } from "src/analytics/analytics";
import {
  FiltersActionTypes,
  type SortValues,
  useFilters,
} from "src/context/filters.context";

export const useFilterHandlers = (category: string) => {
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const { availableStyles, selectedStyles, selectedSort } = filtersState;

  const handleStyleChange = (value: string | string[]) => {
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
  };

  const handleSortChange = (value: string | string[]) => {
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
  };

  const styleOptions = availableStyles.map((style) => ({
    value: style,
    label: style,
  }));

  return {
    handleStyleChange,
    handleSortChange,
    styleOptions,
    selectedStyles,
    selectedSort,
  };
};
