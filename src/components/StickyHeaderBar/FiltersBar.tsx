import classNames from "classnames";
import { useMemo, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { AutocompleteSelect } from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import Button from "src/components/Button/Button.component";
import { FilterMatchOperatorSelect } from "src/components/FilterMatchOperatorSelect/FilterMatchOperatorSelect.component";
import { FiltersDrawer } from "src/components/FiltersDrawer/FiltersDrawer.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { FILTER_ANY_NONE_OPERATOR_OPTIONS } from "src/constants/filterMatchOperators";
import { SORTING_OPTIONS } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  useAppliedFilterCount,
  useFiltersDispatch,
} from "src/hooks/useFilterAtoms.hook";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./FiltersBar.module.css";

interface FiltersBarProps {
  category: string;
  disabled?: boolean;
}

export const FiltersBar = ({ category, disabled = false }: FiltersBarProps) => {
  const { state: collectionState } = useCollectionContext();
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);

  const { fetchingCollection, collection, error } = collectionState;

  const {
    handleStyleChange,
    handleYearChange,
    handleFormatChange,
    handleSortChange,
    handleStyleOperatorChange,
    handleFormatOperatorChange,
    handleYearOperatorChange,
    styleOptions,
    yearOptions,
    formatOptions,
    selectedStyles,
    selectedYears,
    selectedFormats,
    selectedSort,
    styleOperator,
    formatOperator,
    yearOperator,
  } = useFilterHandlers(category);

  const handleFiltersClick = () => {
    setIsFiltersDrawerOpen(true);
    trackEvent("filtersOpened", {
      action: "filtersOpenedFromHeader",
      category: "mobile_filters",
      label: "Filters Opened from Header",
      value: "mobile",
    });
  };

  const closeFiltersDrawer = () => {
    setIsFiltersDrawerOpen(false);
  };

  const filtersDispatch = useFiltersDispatch();
  const appliedFilterCount = useAppliedFilterCount();
  const hasActiveFilters = appliedFilterCount > 0;

  const handleClearAllFilters = () => {
    filtersDispatch({
      type: FiltersActionTypes.ClearAllFilters,
      payload: undefined,
    });
    trackEvent("filtersCleared", {
      action: "clearAllFilters",
      category: "filters",
      label: "Reset Filters",
      value: "desktop",
    });
  };

  const isDisabled = disabled || fetchingCollection || !collection || error;

  const selectedYearValues = useMemo(
    () => selectedYears.map((year) => year.toString()),
    [selectedYears],
  );

  if (isDisabled) {
    return null;
  }

  return (
    <>
      <div className={styles.filtersBar} data-filters-bar>
        <div className={styles.desktopFilters}>
          <SearchBar
            placeholder="Search your collection..."
            disabled={!collection}
            className={styles.searchBar}
          />
          <div className={styles.styleFilterGroup}>
            <AutocompleteSelect
              label="Genre & Style"
              options={styleOptions}
              value={selectedStyles}
              onChange={handleStyleChange}
              disabled={!collection}
              multiple={true}
              placeholder="All genres & styles"
            />

            <FilterMatchOperatorSelect
              selectedCount={selectedStyles.length}
              value={styleOperator}
              onChange={handleStyleOperatorChange}
              disabled={!collection}
            />
          </div>
          <div className={styles.styleFilterGroup}>
            <AutocompleteSelect
              label="Format Type"
              options={formatOptions}
              value={selectedFormats}
              onChange={handleFormatChange}
              disabled={!collection}
              multiple={true}
              placeholder="All format types"
            />
            <FilterMatchOperatorSelect
              selectedCount={selectedFormats.length}
              value={formatOperator}
              onChange={handleFormatOperatorChange}
              disabled={!collection}
            />
          </div>
          <div className={styles.styleFilterGroup}>
            <AutocompleteSelect
              label="Release Year"
              options={yearOptions}
              value={selectedYearValues}
              onChange={handleYearChange}
              disabled={!collection}
              multiple={true}
              placeholder="All release years"
            />
            <FilterMatchOperatorSelect
              selectedCount={selectedYears.length}
              value={yearOperator}
              onChange={handleYearOperatorChange}
              disabled={!collection}
              options={FILTER_ANY_NONE_OPERATOR_OPTIONS}
            />
          </div>
          <Select
            label="Sort by"
            options={SORTING_OPTIONS.map((option) => ({
              value: option.value,
              label: option.name,
            }))}
            value={selectedSort}
            onChange={handleSortChange}
            disabled={fetchingCollection}
            placeholder="Select sort option..."
          />
          <Button
            variant="secondary"
            size="md"
            onPress={handleClearAllFilters}
            disabled={!(collection && hasActiveFilters)}
            aria-label="Reset filters"
            className={classNames(styles.clearAllButton, {
              [styles.clearAllButtonActive]: hasActiveFilters,
            })}
          >
            Reset
          </Button>
        </div>

        <div className={styles.mobileFilters}>
          <Button
            variant="secondary"
            size="sm"
            onPress={handleFiltersClick}
            aria-label="Open filters"
          >
            <span>⚙️</span>
            <span>Filters</span>
          </Button>
        </div>
      </div>

      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={closeFiltersDrawer}
      />
    </>
  );
};
