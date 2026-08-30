import { Activity, useMemo, useState } from "react";
import { AutocompleteSelect } from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import Button from "src/components/Button/Button.component";
import { FilterMatchOperatorSelect } from "src/components/FilterMatchOperatorSelect/FilterMatchOperatorSelect.component";
import { FiltersDrawer } from "src/components/FiltersDrawer/FiltersDrawer.component";
import { FilterViewsMenu } from "src/components/FilterViewsMenu/FilterViewsMenu.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { FILTER_ANY_NONE_OPERATOR_OPTIONS } from "src/constants/filterMatchOperators";
import { SORTING_OPTIONS } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./FiltersBar.module.css";

interface FiltersBarProps {
  disabled?: boolean;
}

export const FiltersBar = ({ disabled = false }: FiltersBarProps) => {
  "use memo";
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
  } = useFilterHandlers();

  const handleFiltersClick = () => {
    setIsFiltersDrawerOpen(true);
  };

  const closeFiltersDrawer = () => {
    setIsFiltersDrawerOpen(false);
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
          <FilterViewsMenu disabled={!collection} />
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

      <Activity mode={isFiltersDrawerOpen ? "visible" : "hidden"}>
        <FiltersDrawer
          isOpen={isFiltersDrawerOpen}
          onClose={closeFiltersDrawer}
        />
      </Activity>
    </>
  );
};
