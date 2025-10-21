import { useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import AutocompleteSelect from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import Button from "src/components/Button/Button.component";
import FiltersDrawer from "src/components/FiltersDrawer/FiltersDrawer.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { SORTING_OPTIONS } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { useCrate } from "src/context/crate.context";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./FiltersBar.module.css";

interface FiltersBarProps {
  category: string;
  disabled?: boolean;
  showCrate?: boolean;
}

export const FiltersBar = ({
  category,
  disabled = false,
  showCrate = true,
}: FiltersBarProps) => {
  const { state: collectionState } = useCollectionContext();
  const { selectedReleases, openDrawer } = useCrate();
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState(false);

  const { fetchingCollection, collection, error } = collectionState;

  const {
    handleStyleChange,
    handleYearChange,
    handleSortChange,
    styleOptions,
    yearOptions,
    selectedStyles,
    selectedYears,
    selectedSort,
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

  const handleCrateClick = () => {
    openDrawer();
    trackEvent("crateOpened", {
      action: "crateOpenedFromHeader",
      category: "crate",
      label: "Crate Opened from Header",
      value: selectedReleases.length.toString(),
    });
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

  if (styleOptions.length === 0 || isDisabled) {
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
          <AutocompleteSelect
            label="Style"
            options={styleOptions}
            value={selectedStyles}
            onChange={handleStyleChange}
            disabled={!collection}
            multiple={true}
            placeholder="Select styles..."
          />
          <AutocompleteSelect
            label="Year"
            options={yearOptions}
            value={selectedYears.map((year) => year.toString())}
            onChange={handleYearChange}
            disabled={!collection}
            multiple={true}
            placeholder="All years"
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

          {/* Crate button in desktop filters */}
          {showCrate && selectedReleases.length > 0 && (
            <Button
              variant="primary"
              size="md"
              onPress={handleCrateClick}
              aria-label={`Open crate with ${selectedReleases.length} items`}
            >
              <span>My Crate</span>
              <span className={styles.crateCount}>
                {selectedReleases.length}
              </span>
            </Button>
          )}
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

          {/* Crate button in mobile filters */}
          {showCrate && selectedReleases.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onPress={handleCrateClick}
              aria-label={`Open crate with ${selectedReleases.length} items`}
            >
              <span>My Crate</span>
              <span className={styles.crateCount}>
                {selectedReleases.length}
              </span>
            </Button>
          )}
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
