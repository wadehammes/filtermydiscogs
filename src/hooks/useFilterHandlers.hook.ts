import { useCallback } from "react";
import {
  type CollectionSortSecondary,
  type SortValues,
  VALID_SORT_SECONDARY_VALUES,
  VALID_SORT_VALUES,
} from "src/constants/sortValues";
import {
  type FiltersActions,
  FiltersActionTypes,
} from "src/context/filters.context";
import {
  useFacetOptions,
  useFiltersDispatch,
  useFormatOperator,
  useSelectedFormats,
  useSelectedSort,
  useSelectedSortSecondary,
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
  const selectedSortSecondary = useSelectedSortSecondary();
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

      if (sortValue && VALID_SORT_VALUES.has(sortValue)) {
        filtersDispatch({
          type: FiltersActionTypes.SetSort,
          payload: sortValue as SortValues,
        });
      }
    },
    [filtersDispatch],
  );

  const handleSortSecondaryChange = useCallback(
    (value: string | string[]) => {
      const sortValue = Array.isArray(value) ? value[0] : value;

      if (!sortValue) {
        return;
      }

      if (VALID_SORT_SECONDARY_VALUES.has(sortValue)) {
        filtersDispatch({
          type: FiltersActionTypes.SetSortSecondary,
          payload: sortValue as CollectionSortSecondary,
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
    handleSortSecondaryChange,
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
    selectedSortSecondary,
    styleOperator,
    formatOperator,
    yearOperator,
  };
};
