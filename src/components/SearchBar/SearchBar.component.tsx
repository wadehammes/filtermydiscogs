"use client";

import classNames from "classnames";
import { startTransition, useCallback, useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { FiltersActionTypes } from "src/context/filters.context";
import {
  useFiltersDispatch,
  useIsSearching,
  useSearchQuery,
} from "src/hooks/useFilterAtoms.hook";
import type { SearchCollectionFormValues } from "src/lib/validation/searchCollection.schemas";
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
  "use memo";
  const filtersDispatch = useFiltersDispatch();
  const searchQuery = useSearchQuery();
  const isSearching = useIsSearching();

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousSearchQueryRef = useRef<string>(searchQuery);

  const { register, reset, setValue, watch } =
    useForm<SearchCollectionFormValues>({
      defaultValues: { query: searchQuery },
    });

  const inputValue = watch("query");
  const pendingInputValueRef = useRef(searchQuery);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        startTransition(() => {
          filtersDispatch({
            type: FiltersActionTypes.SetSearchQuery,
            payload: query,
          });
        });
      }, 300);
    },
    [filtersDispatch],
  );

  const { onBlur, onChange, name, ref: registerRef } = register("query");

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event);
      pendingInputValueRef.current = event.target.value;
      debouncedSearch(event.target.value);
    },
    [debouncedSearch, onChange],
  );

  const handleClear = useCallback(() => {
    setValue("query", "");
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
  }, [filtersDispatch, setValue]);

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
      reset({ query: currentQuery });
      pendingInputValueRef.current = currentQuery;
    }

    if (previousQuery !== "" && currentQuery === "" && inputValue !== "") {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      reset({ query: "" });
      pendingInputValueRef.current = "";
    }

    previousSearchQueryRef.current = currentQuery;
  }, [inputValue, reset, searchQuery]);

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
          ref={(element) => {
            registerRef(element);
            inputRef.current = element;
          }}
          id={inputId}
          name={name}
          type="text"
          onBlur={onBlur}
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
