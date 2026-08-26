import { useCallback } from "react";
import { trackEvent } from "src/analytics/analytics";
import {
  type FiltersActions,
  FiltersActionTypes,
  type SortValues,
} from "src/context/filters.context";
import {
  useFacetOptions,
  useFiltersDispatch,
  useFormatOperator,
  useSelectedFormats,
  useSelectedSort,
  useSelectedStyles,
  useSelectedYears,
  useStyleOperator,
  useYearOperator,
} from "src/hooks/useFilterAtoms.hook";
import {
  isFilterMatchOperator,
  isYearMatchOperator,
} from "src/types/filters.types";

const createMatchOperatorHandler =
  <T extends "AND" | "OR" | "NONE">({
    category,
    filtersDispatch,
    analyticsEvent,
    analyticsAction,
    analyticsLabel,
    actionType,
    isValidOperator,
  }: {
    category: string;
    filtersDispatch: ReturnType<typeof useFiltersDispatch>;
    analyticsEvent: string;
    analyticsAction: string;
    analyticsLabel: string;
    actionType:
      | FiltersActionTypes.SetStyleOperator
      | FiltersActionTypes.SetFormatOperator
      | FiltersActionTypes.SetYearOperator;
    isValidOperator: (value: string | undefined) => value is T;
  }) =>
  (value: string | string[]) => {
    const operatorValue = Array.isArray(value) ? value[0] : value;

    if (!isValidOperator(operatorValue)) {
      return;
    }

    trackEvent(analyticsEvent, {
      action: analyticsAction,
      category,
      label: analyticsLabel,
      value: operatorValue,
    });

    filtersDispatch({
      type: actionType,
      payload: operatorValue,
    } as Extract<FiltersActions, { type: typeof actionType }>);
  };

export const useFilterHandlers = (category: string) => {
  const filtersDispatch = useFiltersDispatch();
  const { availableStyles, availableYears, availableFormats } =
    useFacetOptions();
  const selectedStyles = useSelectedStyles();
  const selectedYears = useSelectedYears();
  const selectedFormats = useSelectedFormats();
  const selectedSort = useSelectedSort();
  const styleOperator = useStyleOperator();
  const formatOperator = useFormatOperator();
  const yearOperator = useYearOperator();

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

  const handleFormatChange = useCallback(
    (value: string | string[]) => {
      const selectedOptions = Array.isArray(value) ? value : [value];

      trackEvent("releaseFormat", {
        action: "releaseFormatChanged",
        category,
        label: "Release Format Changed",
        value: selectedOptions.join(","),
      });

      filtersDispatch({
        type: FiltersActionTypes.SetFormats,
        payload: selectedOptions,
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

  const handleStyleOperatorChange = useCallback(
    createMatchOperatorHandler({
      category,
      filtersDispatch,
      analyticsEvent: "styleOperator",
      analyticsAction: "styleOperatorChanged",
      analyticsLabel: "Style Operator Changed",
      actionType: FiltersActionTypes.SetStyleOperator,
      isValidOperator: isFilterMatchOperator,
    }),
    [],
  );

  const handleFormatOperatorChange = useCallback(
    createMatchOperatorHandler({
      category,
      filtersDispatch,
      analyticsEvent: "formatOperator",
      analyticsAction: "formatOperatorChanged",
      analyticsLabel: "Format Operator Changed",
      actionType: FiltersActionTypes.SetFormatOperator,
      isValidOperator: isFilterMatchOperator,
    }),
    [],
  );

  const handleYearOperatorChange = useCallback(
    createMatchOperatorHandler({
      category,
      filtersDispatch,
      analyticsEvent: "yearOperator",
      analyticsAction: "yearOperatorChanged",
      analyticsLabel: "Year Operator Changed",
      actionType: FiltersActionTypes.SetYearOperator,
      isValidOperator: isYearMatchOperator,
    }),
    [],
  );

  return {
    handleStyleChange,
    handleYearChange,
    handleFormatChange,
    handleSortChange,
    handleStyleOperatorChange,
    handleFormatOperatorChange,
    handleYearOperatorChange,
    styleOptions: availableStyles.map((style) => ({
      value: style,
      label: style,
    })),
    yearOptions: availableYears.map((year) => ({
      value: year.toString(),
      label: year.toString(),
    })),
    formatOptions: availableFormats.map((format) => ({
      value: format,
      label: format,
    })),
    selectedStyles,
    selectedYears,
    selectedFormats,
    selectedSort,
    styleOperator,
    formatOperator,
    yearOperator,
  };
};
