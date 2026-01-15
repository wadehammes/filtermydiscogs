import AutocompleteSelect from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import Select from "src/components/Select/Select.component";
import { SORTING_OPTIONS } from "src/constants/sorting";
import { useCollectionContext } from "src/context/collection.context";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import styles from "./FilterControls.module.css";

interface FilterControlsProps {
  category: string;
  disabled?: boolean;
}

export const FilterControls = ({
  category,
  disabled = false,
}: FilterControlsProps) => {
  const { state: collectionState } = useCollectionContext();
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
    styleOperatorOptions,
    selectedStyles,
    selectedYears,
    selectedFormats,
    selectedSort,
    styleOperator,
  } = useFilterHandlers(category);

  const isDisabled = disabled || fetchingCollection || !collection || error;

  if (isDisabled) {
    return null;
  }

  return (
    <div className={styles.filtersContainer}>
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
    </div>
  );
};
