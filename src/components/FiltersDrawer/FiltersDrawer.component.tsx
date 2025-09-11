import { useState } from "react";
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
    handleSortChange,
    styleOptions,
    selectedStyles,
    selectedSort,
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
    <>
      {isOpen && (
        <button
          className={`${styles.backdrop} ${isOpen ? styles.open : ""}`}
          onClick={onClose}
          type="button"
        />
      )}
      <div className={`${styles.drawer} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filters</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
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
      </div>
    </>
  );
};

export default FiltersDrawer;
