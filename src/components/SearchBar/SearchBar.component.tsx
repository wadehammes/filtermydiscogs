"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiltersActionTypes, useFilters } from "src/context/filters.context";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const SearchBar = ({
  className,
  placeholder = "Search your collection...",
  disabled = false,
}: SearchBarProps) => {
  const { state: filtersState, dispatch: filtersDispatch } = useFilters();
  const [inputValue, setInputValue] = useState("");
  const { isSearching } = filtersState;

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousSearchQueryRef = useRef<string>(filtersState.searchQuery);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        filtersDispatch({
          type: FiltersActionTypes.SetSearchQuery,
          payload: query,
        });
      }, 300);
    },
    [filtersDispatch],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    filtersDispatch({
      type: FiltersActionTypes.SetSearching,
      payload: false,
    });
    filtersDispatch({
      type: FiltersActionTypes.SetSearchQuery,
      payload: "",
    });
    inputRef.current?.focus();
  }, [filtersDispatch]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        handleClear();
      }
    },
    [handleClear],
  );

  // Sync local input value when search query is cleared externally (e.g., Clear All Filters)
  // Only clear if searchQuery changed from non-empty to empty (external clear), not during typing
  useEffect(() => {
    const previousQuery = previousSearchQueryRef.current;
    const currentQuery = filtersState.searchQuery;

    // If searchQuery was cleared externally (changed from non-empty to empty)
    // and we have a local input value, clear it
    if (previousQuery !== "" && currentQuery === "" && inputValue !== "") {
      // Clear the debounce timeout if it exists
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      setInputValue("");
    }

    // Update the ref for next comparison
    previousSearchQueryRef.current = currentQuery;
  }, [filtersState.searchQuery, inputValue]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`${styles.searchBar} ${className || ""}`}>
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`${styles.input} ${isSearching ? styles.searching : ""}`}
          aria-label="Search collection"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
