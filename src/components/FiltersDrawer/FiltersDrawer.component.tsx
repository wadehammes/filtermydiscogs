import { useMemo, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { AutocompleteSelect } from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import Button from "src/components/Button/Button.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { SORTING_CATEGORIES } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  useAppliedFilterCount,
  useFiltersDispatch,
} from "src/hooks/useFilterAtoms.hook";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./FiltersDrawer.module.css";

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FiltersDrawer = ({ isOpen, onClose }: FiltersDrawerProps) => {
  const { state: collectionState } = useCollectionContext();
  const filtersDispatch = useFiltersDispatch();
  const appliedFilterCount = useAppliedFilterCount();
  const [sortCategory, setSortCategory] =
    useState<keyof typeof SORTING_CATEGORIES>("alphabetical");

  const {
    handleStyleChange,
    handleYearChange,
    handleFormatChange,
    handleSortChange,
    handleStyleOperatorChange,
    styleOptions,
    yearOptions,
    formatOptions,
    styleOperatorOptions,
    selectedStyles,
    selectedYears,
    selectedFormats,
    selectedSort,
    styleOperator,
  } = useFilterHandlers("mobile_filters");

  const { fetchingCollection, collection, error } = collectionState;

  const hasActiveFilters = appliedFilterCount > 0;

  const drawerTitle = useMemo(() => {
    if (appliedFilterCount === 0) {
      return "Filters";
    }

    return `Filters (${appliedFilterCount})`;
  }, [appliedFilterCount]);

  const handleClearAllFilters = () => {
    filtersDispatch({
      type: FiltersActionTypes.ClearAllFilters,
      payload: undefined,
    });
    trackEvent("filtersCleared", {
      action: "clearAllFilters",
      category: "mobile_filters",
      label: "Clear All Filters",
      value: "mobile",
    });
  };

  const categoryOptions = [
    { value: "alphabetical", label: "Alphabetical" },
    { value: "chronological", label: "Chronological" },
    { value: "rating", label: "Rating" },
  ];

  const currentSortOptions = SORTING_CATEGORIES[sortCategory].map((sort) => ({
    value: sort.value,
    label: sort.name,
  }));

  const handleCategoryChange = (value: string | string[]) => {
    const category = (
      Array.isArray(value) ? value[0] : value
    ) as keyof typeof SORTING_CATEGORIES;
    setSortCategory(category);

    const firstOption = SORTING_CATEGORIES[category][0];
    if (firstOption) {
      handleSortChange(firstOption.value);
    }
  };

  const selectedYearValues = useMemo(
    () => selectedYears.map((year) => year.toString()),
    [selectedYears],
  );

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={drawerTitle}
      closeButtonAriaLabel="Close filters"
      dataAttribute="data-filters-drawer-open"
      footer={
        <div className={styles.footer}>
          {hasActiveFilters ? (
            <p className={styles.activeFiltersHint}>
              {appliedFilterCount === 1
                ? "1 filter applied"
                : `${appliedFilterCount} filters applied`}
            </p>
          ) : null}
          <Button
            variant="secondary"
            size="md"
            onPress={handleClearAllFilters}
            disabled={!(collection && hasActiveFilters)}
            aria-label="Clear all filters"
            className={styles.clearAllButton}
          >
            Clear All
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.filterSection}>
          <SearchBar
            showLabel
            placeholder="Search your collection..."
            disabled={!collection}
            className={styles.searchBar}
          />
        </div>

        {styleOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <AutocompleteSelect
              showLabel
              clearable
              label="Genre & Style"
              options={styleOptions}
              value={selectedStyles}
              onChange={handleStyleChange}
              disabled={!collection}
              multiple={true}
              placeholder="Select genres & styles..."
            />
            {selectedStyles.length > 1 ? (
              <Select
                showLabel
                label="Match"
                options={styleOperatorOptions}
                value={styleOperator}
                onChange={handleStyleOperatorChange}
                disabled={!collection}
                placeholder="Select operator..."
              />
            ) : null}
          </div>
        )}

        {yearOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <AutocompleteSelect
              showLabel
              clearable
              label="Release Year"
              options={yearOptions}
              value={selectedYearValues}
              onChange={handleYearChange}
              disabled={!collection}
              multiple={true}
              placeholder="All release years"
            />
          </div>
        )}

        {formatOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <AutocompleteSelect
              showLabel
              clearable
              label="Format Type"
              options={formatOptions}
              value={selectedFormats}
              onChange={handleFormatChange}
              disabled={!collection}
              multiple={true}
              placeholder="All format types"
            />
          </div>
        )}

        <div className={styles.filterSection}>
          <div className={styles.sortFilterGroup}>
            <Select
              showLabel
              label="Sort by"
              options={categoryOptions}
              value={sortCategory}
              onChange={handleCategoryChange}
              disabled={fetchingCollection}
              placeholder="Select category..."
            />
            <Select
              showLabel
              label="Order"
              options={currentSortOptions}
              value={selectedSort}
              onChange={handleSortChange}
              disabled={fetchingCollection}
              placeholder="Select order..."
            />
          </div>
        </div>
      </div>
    </BottomDrawer>
  );
};
