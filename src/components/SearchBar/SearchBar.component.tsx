"use client";

import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  useFiltersDispatch,
  useIsSearching,
  useSearchQuery,
} from "src/hooks/useFilterAtoms.hook";
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
  const filtersDispatch = useFiltersDispatch();
  const searchQuery = useSearchQuery();
  const isSearching = useIsSearching();
  const [inputValue, setInputValue] = useState(searchQuery);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousSearchQueryRef = useRef<string>(searchQuery);

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

  // Sync local input when searchQuery changes externally (persisted restore, Clear All Filters)
  useEffect(() => {
    const previousQuery = previousSearchQueryRef.current;
    const currentQuery = searchQuery;

    if (previousQuery === "" && currentQuery !== "" && inputValue === "") {
      setInputValue(currentQuery);
    }

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
  }, [searchQuery, inputValue]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={classNames(styles.searchBar, className)}
      data-testid="fmdSearchBar"
    >
      <div className={styles.inputContainer}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={classNames(styles.input, {
            [styles.searching]: isSearching,
          })}
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
