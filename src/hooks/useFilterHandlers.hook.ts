import { useCallback, useMemo } from "react";
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
  useExcludedFormats,
  useExcludedStyles,
  useExcludedYears,
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
import { withSelectedFilterSelectOptions } from "src/utils/filterSelectOptions";

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
  const excludedStyles = useExcludedStyles();
  const excludedYears = useExcludedYears();
  const excludedFormats = useExcludedFormats();
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

  const {
    handleAddExcludedStyle,
    handleRemoveExcludedStyle,
    handleAddExcludedFormat,
    handleRemoveExcludedFormat,
    handleAddExcludedYear,
    handleRemoveExcludedYear,
  } = useMemo(() => {
    const dispatchExcludedYear = (yearValue: string, remove: boolean) => {
      const year = Number.parseInt(yearValue, 10);
      if (Number.isNaN(year)) {
        return;
      }

      filtersDispatch({
        type: remove
          ? FiltersActionTypes.RemoveExcludedYear
          : FiltersActionTypes.AddExcludedYear,
        payload: year,
      });
    };

    return {
      handleAddExcludedStyle: (style: string) => {
        filtersDispatch({
          type: FiltersActionTypes.AddExcludedStyle,
          payload: style,
        });
      },
      handleRemoveExcludedStyle: (style: string) => {
        filtersDispatch({
          type: FiltersActionTypes.RemoveExcludedStyle,
          payload: style,
        });
      },
      handleAddExcludedFormat: (format: string) => {
        filtersDispatch({
          type: FiltersActionTypes.AddExcludedFormat,
          payload: format,
        });
      },
      handleRemoveExcludedFormat: (format: string) => {
        filtersDispatch({
          type: FiltersActionTypes.RemoveExcludedFormat,
          payload: format,
        });
      },
      handleAddExcludedYear: (yearValue: string) => {
        dispatchExcludedYear(yearValue, false);
      },
      handleRemoveExcludedYear: (yearValue: string) => {
        dispatchExcludedYear(yearValue, true);
      },
    };
  }, [filtersDispatch]);

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

  const selectedYearLabels = selectedYears.map(String);
  const excludedYearLabels = excludedYears.map(String);

  return {
    handleStyleChange,
    handleAddExcludedStyle,
    handleRemoveExcludedStyle,
    excludedStyles,
    handleAddExcludedFormat,
    handleRemoveExcludedFormat,
    excludedFormats,
    handleAddExcludedYear,
    handleRemoveExcludedYear,
    excludedYears,
    excludedYearLabels,
    handleYearChange,
    handleFormatChange,
    handleSortChange,
    handleSortSecondaryChange,
    handleStyleOperatorChange,
    handleFormatOperatorChange,
    handleYearOperatorChange,
    styleOptions: withSelectedFilterSelectOptions(
      availableStyles,
      selectedStyles,
    ),
    yearOptions: withSelectedFilterSelectOptions(availableYears.map(String), [
      ...selectedYearLabels,
      ...excludedYearLabels,
    ]),
    formatOptions: withSelectedFilterSelectOptions(availableFormats, [
      ...selectedFormats,
      ...excludedFormats,
    ]),
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
