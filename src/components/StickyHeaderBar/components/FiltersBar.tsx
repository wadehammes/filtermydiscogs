import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import AutocompleteSelect from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import Button from "src/components/Button/Button.component";
import FiltersDrawer from "src/components/FiltersDrawer/FiltersDrawer.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { SORTING_OPTIONS } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
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
    styleOptions,
    yearOptions,
    formatOptions,
    selectedStyles,
    selectedYears,
    selectedFormats,
    selectedSort,
    styleOperator,
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

  const { dispatch: filtersDispatch } = useFilters();

  const handleClearAllFilters = () => {
    filtersDispatch({
      type: FiltersActionTypes.ClearAllFilters,
      payload: undefined,
    });
    trackEvent("filtersCleared", {
      action: "clearAllFilters",
      category: "filters",
      label: "Clear All Filters",
      value: "desktop",
    });
  };

  const isDisabled = disabled || fetchingCollection || !collection || error;

  if (isDisabled) {
    return null;
  }

  return (
    <>
      <div className={styles.filtersBar}>
        {/* Desktop filters */}
        <div className={styles.desktopFilters}>
          <SearchBar
            placeholder="Search your collection..."
            disabled={!collection}
            className={styles.searchBar || ""}
          />
          <div className={styles.styleFilterGroup}>
            <AutocompleteSelect
              label="Style"
              options={styleOptions}
              value={selectedStyles}
              onChange={handleStyleChange}
              disabled={!collection}
              multiple={true}
              placeholder="Select styles..."
            />
            {selectedStyles.length > 1 && (
              <div className={styles.styleOperatorSegment}>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    styleOperator === "OR" ? styles.active : ""
                  }`}
                  onClick={() => handleStyleOperatorChange("OR")}
                  disabled={!collection}
                  aria-label="Match any style (OR)"
                  title="Match any style (OR)"
                >
                  Any (OR)
                </button>
                <button
                  type="button"
                  className={`${styles.segmentButton} ${
                    styleOperator === "AND" ? styles.active : ""
                  }`}
                  onClick={() => handleStyleOperatorChange("AND")}
                  disabled={!collection}
                  aria-label="Match all styles (AND)"
                  title="Match all styles (AND)"
                >
                  All (AND)
                </button>
              </div>
            )}
          </div>
          <AutocompleteSelect
            label="Release Year"
            options={yearOptions}
            value={selectedYears.map((year) => year.toString())}
            onChange={handleYearChange}
            disabled={!collection}
            multiple={true}
            placeholder="All release years"
          />
          <AutocompleteSelect
            label="Format"
            options={formatOptions}
            value={selectedFormats}
            onChange={handleFormatChange}
            disabled={!collection}
            multiple={true}
            placeholder="All formats"
          />
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
            disabled={!collection}
            aria-label="Clear all filters"
          >
            Clear All
          </Button>
        </div>

        {/* Mobile filters button */}
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

      {/* Mobile filters drawer */}
      <FiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={closeFiltersDrawer}
      />
    </>
  );
};
