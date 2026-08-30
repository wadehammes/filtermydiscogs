import { useCallback } from "react";
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
    filtersDispatch,
    actionType,
    isValidOperator,
  }: {
    filtersDispatch: ReturnType<typeof useFiltersDispatch>;
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

    filtersDispatch({
      type: actionType,
      payload: operatorValue,
    } as Extract<FiltersActions, { type: typeof actionType }>);
  };

export const useFilterHandlers = () => {
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

      filtersDispatch({
        type: FiltersActionTypes.SetStyles,
        payload: selectedOptions,
      });
    },
    [filtersDispatch],
  );

  const handleYearChange = useCallback(
    (value: string | string[]) => {
      const selectedOptions = Array.isArray(value) ? value : [value];
      const selectedYears = selectedOptions.map((year) => parseInt(year, 10));

      filtersDispatch({
        type: FiltersActionTypes.SetYears,
        payload: selectedYears,
      });
    },
    [filtersDispatch],
  );

  const handleFormatChange = useCallback(
    (value: string | string[]) => {
      const selectedOptions = Array.isArray(value) ? value : [value];

      filtersDispatch({
        type: FiltersActionTypes.SetFormats,
        payload: selectedOptions,
      });
    },
    [filtersDispatch],
  );

  const handleSortChange = useCallback(
    (value: string | string[]) => {
      const sortValue = Array.isArray(value) ? value[0] : value;

      if (sortValue) {
        filtersDispatch({
          type: FiltersActionTypes.SetSort,
          payload: sortValue as SortValues,
        });
      }
    },
    [filtersDispatch],
  );

  const handleStyleOperatorChange = useCallback(
    createMatchOperatorHandler({
      filtersDispatch,
      actionType: FiltersActionTypes.SetStyleOperator,
      isValidOperator: isFilterMatchOperator,
    }),
    [],
  );

  const handleFormatOperatorChange = useCallback(
    createMatchOperatorHandler({
      filtersDispatch,
      actionType: FiltersActionTypes.SetFormatOperator,
      isValidOperator: isFilterMatchOperator,
    }),
    [],
  );

  const handleYearOperatorChange = useCallback(
    createMatchOperatorHandler({
      filtersDispatch,
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
