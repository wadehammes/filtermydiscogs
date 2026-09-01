import classNames from "classnames";
import { useMemo, useState } from "react";
import {
  type AutocompleteOption,
  AutocompleteSelect,
} from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import { BottomDrawer } from "src/components/BottomDrawer/BottomDrawer.component";
import Button from "src/components/Button/Button.component";
import { FilterMatchOperatorSelect } from "src/components/FilterMatchOperatorSelect/FilterMatchOperatorSelect.component";
import { FilterViewsMenu } from "src/components/FilterViewsMenu/FilterViewsMenu.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { FILTER_ANY_NONE_OPERATOR_OPTIONS } from "src/constants/filterMatchOperators";
import { SORTING_CATEGORIES } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { useAppliedFilterCount } from "src/hooks/useFilterAtoms.hook";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import type { StyleOperator, YearOperator } from "src/types/filters.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./FiltersDrawer.module.css";

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type DrawerFacetFilterProps = {
  label: string;
  options: AutocompleteOption[];
  selectedValues: string[];
  onValuesChange: (value: string | string[]) => void;
  placeholder: string;
  disabled: boolean;
  operatorValue: StyleOperator | YearOperator;
  onOperatorChange: (value: string | string[]) => void;
  operatorOptions?: ReadonlyArray<{
    value: StyleOperator | YearOperator;
    label: string;
  }>;
};

const DrawerFacetFilter = ({
  label,
  options,
  selectedValues,
  onValuesChange,
  placeholder,
  disabled,
  operatorValue,
  onOperatorChange,
  operatorOptions,
}: DrawerFacetFilterProps) => {
  const hasSelections = selectedValues.length > 0;

  return (
    <div className={styles.facetFilterGroup}>
      <span className={styles.facetLabel}>{label}</span>
      <div className={styles.facetFilterControls}>
        <AutocompleteSelect
          label={label}
          options={options}
          value={selectedValues}
          onChange={onValuesChange}
          disabled={disabled}
          multiple={true}
          placeholder={placeholder}
        />
        <FilterMatchOperatorSelect
          selectedCount={selectedValues.length}
          value={operatorValue}
          onChange={onOperatorChange}
          disabled={disabled}
          {...definedProps({ options: operatorOptions })}
        />
        {hasSelections ? (
          <Button
            variant="secondary"
            size="md"
            className={styles.facetClearButton}
            onPress={() => {
              onValuesChange([]);
            }}
            disabled={disabled}
            aria-label={`Clear ${label}`}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export const FiltersDrawer = ({ isOpen, onClose }: FiltersDrawerProps) => {
  const { state: collectionState } = useCollectionContext();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const appliedFilterCount = useAppliedFilterCount();
  const [sortCategory, setSortCategory] =
    useState<keyof typeof SORTING_CATEGORIES>("alphabetical");

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
  } = useFilterHandlers();

  const { fetchingCollection, collection, error } = collectionState;

  const hasActiveFilters = appliedFilterCount > 0;

  const drawerTitle = useMemo(() => {
    if (appliedFilterCount === 0) {
      return "Filters";
    }

    return `Filters (${appliedFilterCount})`;
  }, [appliedFilterCount]);

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
      chrome
      title={drawerTitle}
      titleId="filters-drawer-title"
      closeButtonAriaLabel="Close filters"
      dataAttribute="data-filters-drawer-open"
      aboveMiniPlayer={isMiniPlayerVisible}
      footer={
        hasActiveFilters ? (
          <div className={styles.footer}>
            <p className={styles.activeFiltersHint}>
              {appliedFilterCount === 1
                ? "1 filter applied"
                : `${appliedFilterCount} filters applied`}
            </p>
          </div>
        ) : undefined
      }
    >
      <div className={styles.content}>
        <div className={classNames(styles.filterSection, styles.viewsSection)}>
          <FilterViewsMenu disabled={!collection} variant="drawer" />
        </div>

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
            <DrawerFacetFilter
              label="Genre & Style"
              options={styleOptions}
              selectedValues={selectedStyles}
              onValuesChange={handleStyleChange}
              placeholder="All genres & styles"
              disabled={!collection}
              operatorValue={styleOperator}
              onOperatorChange={handleStyleOperatorChange}
            />
          </div>
        )}

        {formatOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <DrawerFacetFilter
              label="Format Type"
              options={formatOptions}
              selectedValues={selectedFormats}
              onValuesChange={handleFormatChange}
              placeholder="All format types"
              disabled={!collection}
              operatorValue={formatOperator}
              onOperatorChange={handleFormatOperatorChange}
            />
          </div>
        )}

        {yearOptions.length > 0 && !fetchingCollection && !error && (
          <div className={styles.filterSection}>
            <DrawerFacetFilter
              label="Release Year"
              options={yearOptions}
              selectedValues={selectedYearValues}
              onValuesChange={handleYearChange}
              placeholder="All release years"
              disabled={!collection}
              operatorValue={yearOperator}
              onOperatorChange={handleYearOperatorChange}
              operatorOptions={FILTER_ANY_NONE_OPERATOR_OPTIONS}
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
