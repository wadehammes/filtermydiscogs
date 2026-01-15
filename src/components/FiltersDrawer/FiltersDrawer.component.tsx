import { useState } from "react";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { SORTING_CATEGORIES } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./FiltersDrawer.module.css";

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FiltersDrawer = ({ isOpen, onClose }: FiltersDrawerProps) => {
  const { state: collectionState } = useCollectionContext();
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

    // Reset to first option in the new category
    const firstOption = SORTING_CATEGORIES[category][0];
    if (firstOption) {
      handleSortChange(firstOption.value);
    }
  };

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      closeButtonAriaLabel="Close filters"
      dataAttribute="data-filters-drawer-open"
    >
      <div className={styles.content}>
        <div className={styles.filterSection}>
          <h3 className={styles.sectionTitle}>Search</h3>
          <SearchBar
            placeholder="Search your collection..."
            disabled={!collection}
            className={styles.searchBar || ""}
          />
        </div>

        {styleOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Style</h3>
            <Select
              label="Style"
              options={styleOptions}
              value={selectedStyles}
              onChange={handleStyleChange}
              disabled={!collection}
              multiple={true}
              placeholder="Select styles..."
            />
            {selectedStyles.length > 1 && (
              <Select
                label="Match"
                options={styleOperatorOptions}
                value={styleOperator}
                onChange={handleStyleOperatorChange}
                disabled={!collection}
                placeholder="Select operator..."
              />
            )}
          </div>
        )}

        {yearOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Release Year</h3>
            <Select
              label="Release Year"
              options={yearOptions}
              value={selectedYears.map((year) => year.toString())}
              onChange={handleYearChange}
              disabled={!collection}
              multiple={true}
              placeholder="All release years"
            />
          </div>
        )}

        {formatOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <h3 className={styles.sectionTitle}>Format</h3>
            <Select
              label="Format"
              options={formatOptions}
              value={selectedFormats}
              onChange={handleFormatChange}
              disabled={!collection}
              multiple={true}
              placeholder="All formats"
            />
          </div>
        )}

        <div className={styles.filterSection}>
          <h3 className={styles.sectionTitle}>Sort</h3>
          <Select
            label="Sort by"
            options={categoryOptions}
            value={sortCategory}
            onChange={handleCategoryChange}
            disabled={fetchingCollection}
            placeholder="Select category..."
          />
          <Select
            label="Order"
            options={currentSortOptions}
            value={selectedSort}
            onChange={handleSortChange}
            disabled={fetchingCollection}
            placeholder="Select order..."
          />
        </div>
      </div>
    </BottomDrawer>
  );
};

export default FiltersDrawer;
