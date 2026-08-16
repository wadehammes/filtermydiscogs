"use client";

import classNames from "classnames";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { trackCollectionSearched } from "src/analytics/productAnalyticsEvents";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  useFiltersDispatch,
  useIsSearching,
  useSearchQuery,
} from "src/hooks/useFilterAtoms.hook";
import SearchIcon from "src/styles/icons/search-thin.svg";
import styles from "./SearchBar.module.css";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  showLabel?: boolean;
}

export const SearchBar = ({
  className,
  placeholder = "Search your collection...",
  disabled = false,
  label = "Search",
  showLabel = false,
}: SearchBarProps) => {
  const filtersDispatch = useFiltersDispatch();
  const searchQuery = useSearchQuery();
  const isSearching = useIsSearching();
  const [inputValue, setInputValue] = useState(searchQuery);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousSearchQueryRef = useRef<string>(searchQuery);
  const pendingInputValueRef = useRef(searchQuery);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const trimmed = query.trim();
        if (trimmed) {
          trackCollectionSearched(trimmed.length);
        }
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
      pendingInputValueRef.current = value;
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    pendingInputValueRef.current = "";
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

  useEffect(() => {
    const previousQuery = previousSearchQueryRef.current;
    const currentQuery = searchQuery;

    if (previousQuery === "" && currentQuery !== "" && inputValue === "") {
      setInputValue(currentQuery);
      pendingInputValueRef.current = currentQuery;
    }

    if (previousQuery !== "" && currentQuery === "" && inputValue !== "") {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      setInputValue("");
      pendingInputValueRef.current = "";
    }

    previousSearchQueryRef.current = currentQuery;
  }, [searchQuery, inputValue]);

  useEffect(() => {
    return () => {
      if (!debounceTimeoutRef.current) {
        return;
      }

      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;

      if (disabled) {
        return;
      }

      filtersDispatch({
        type: FiltersActionTypes.SetSearchQuery,
        payload: pendingInputValueRef.current,
      });
    };
  }, [disabled, filtersDispatch]);

  return (
    <div
      className={classNames(styles.searchBar, className)}
      data-testid="fmdSearchBar"
    >
      {showLabel ? (
        <label
          htmlFor={inputId}
          className={styles.label}
          data-filter-field-label
        >
          {label}
        </label>
      ) : null}
      <div className={styles.inputContainer}>
        <span className={styles.searchIcon} aria-hidden>
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={classNames(styles.input, {
            [styles.searching]: isSearching,
          })}
          aria-label={showLabel ? undefined : "Search collection"}
        />

        {inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
};
