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
  const [inputValue, setInputValue] = useState(filtersState.searchQuery);
  const { isSearching } = filtersState;

  // Sync input value with external state changes
  useEffect(() => {
    setInputValue(filtersState.searchQuery);
  }, [filtersState.searchQuery]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized debounced search with cleanup and loading state
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set searching state immediately to prevent UI flickering
      if (query !== filtersState.searchQuery) {
        filtersDispatch({
          type: FiltersActionTypes.SetSearching,
          payload: true,
        });

        debounceTimeoutRef.current = setTimeout(() => {
          filtersDispatch({
            type: FiltersActionTypes.SetSearchQuery,
            payload: query,
          });
        }, 300);
      }
    },
    [filtersDispatch, filtersState.searchQuery],
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

  // Cleanup timeout on unmount
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
          disabled={disabled || isSearching}
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
