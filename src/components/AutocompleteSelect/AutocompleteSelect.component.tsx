import classNames from "classnames";
import { memo, useCallback, useEffect, useId, useReducer, useRef } from "react";
import Button from "src/components/Button/Button.component";
import { useAnchoredPopoverLayout } from "src/hooks/useAnchoredPopoverLayout.hook";
import {
  estimateAutocompleteMenuHeight,
  shouldOpenPopoverUpward,
} from "src/utils/popoverPlacement";
import { AutocompleteDropdown } from "./AutocompleteDropdown.component";
import styles from "./AutocompleteSelect.module.css";
import { AutocompleteTrigger } from "./AutocompleteTrigger.component";

export interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteSelectProps {
  label: string;
  options: AutocompleteOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  clearable?: boolean;
}

type AutocompleteState = {
  isOpen: boolean;
  searchTerm: string;
  focusedIndex: number;
  openUpward: boolean;
};

type AutocompleteAction =
  | { type: "CLOSE" }
  | { type: "OPEN" }
  | { type: "TOGGLE" }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_FOCUSED"; payload: number }
  | { type: "SET_OPEN_UPWARD"; payload: boolean }
  | { type: "RESET_FOCUS" };

const initialState: AutocompleteState = {
  isOpen: false,
  searchTerm: "",
  focusedIndex: -1,
  openUpward: false,
};

function autocompleteReducer(
  state: AutocompleteState,
  action: AutocompleteAction,
): AutocompleteState {
  switch (action.type) {
    case "CLOSE":
      return {
        ...state,
        isOpen: false,
        searchTerm: "",
        focusedIndex: -1,
      };
    case "OPEN":
      return { ...state, isOpen: true, searchTerm: "", focusedIndex: -1 };
    case "TOGGLE":
      return state.isOpen
        ? { ...state, isOpen: false, searchTerm: "", focusedIndex: -1 }
        : { ...state, isOpen: true, searchTerm: "", focusedIndex: -1 };
    case "SET_SEARCH":
      return { ...state, searchTerm: action.payload, focusedIndex: -1 };
    case "SET_FOCUSED":
      return { ...state, focusedIndex: action.payload };
    case "SET_OPEN_UPWARD":
      return { ...state, openUpward: action.payload };
    case "RESET_FOCUS":
      return { ...state, focusedIndex: -1 };
    default:
      return state;
  }
}

const AutocompleteSelectComponent = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  multiple = false,
  placeholder,
  className,
  showLabel = false,
  clearable = false,
}: AutocompleteSelectProps) => {
  const labelId = useId();
  const [state, dispatch] = useReducer(autocompleteReducer, initialState);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const { anchorStyle } = useAnchoredPopoverLayout({
    isOpen: state.isOpen,
    openUpward: state.openUpward,
    anchorRef,
    panelRef: dropdownRef,
  });

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(state.searchTerm.toLowerCase()),
  );

  const hasSelectedValues =
    multiple && Array.isArray(value) && value.length > 0;
  const showClearButton = clearable && hasSelectedValues && !disabled;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }

      dispatch({ type: "CLOSE" });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [state.isOpen]);

  useEffect(() => {
    if (state.isOpen && anchorRef.current) {
      dispatch({
        type: "SET_OPEN_UPWARD",
        payload: shouldOpenPopoverUpward({
          trigger: anchorRef.current,
          estimatedMenuHeight: estimateAutocompleteMenuHeight(
            filteredOptions.length,
          ),
        }),
      });
    }
  }, [state.isOpen, filteredOptions.length]);

  const getDisplayValue = useCallback((): string => {
    if (!value) return placeholder || "";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : placeholder || "";
    }
    const option = options.find((opt) => opt.value === value);
    return option?.label || placeholder || "";
  }, [value, placeholder, options]);

  const getSelectedOptions = useCallback((): AutocompleteOption[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return options.filter((option) => value.includes(option.value));
    }
    const option = options.find((opt) => opt.value === value);
    return option ? [option] : [];
  }, [value, options]);

  const handleOptionClick = useCallback(
    (optionValue: string) => {
      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        const isCurrentlySelected = currentValue.includes(optionValue);

        if (isCurrentlySelected) {
          onChange(currentValue.filter((v) => v !== optionValue));
        } else {
          onChange([...currentValue, optionValue]);
        }
      } else {
        onChange(optionValue);
        dispatch({ type: "CLOSE" });
      }
    },
    [multiple, value, onChange],
  );

  const handleClearOption = useCallback(
    (optionValue: string, event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        onChange(currentValue.filter((v) => v !== optionValue));
      }
    },
    [multiple, value, onChange],
  );

  const handleClearAll = useCallback(() => {
    onChange([]);
    dispatch({ type: "CLOSE" });
  }, [onChange]);

  const handleInputChange = useCallback(
    (searchValue: string) => {
      dispatch({ type: "SET_SEARCH", payload: searchValue });
      if (!state.isOpen) {
        dispatch({ type: "OPEN" });
      }
    },
    [state.isOpen],
  );

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!state.isOpen) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          dispatch({ type: "OPEN" });
        }
      }
    },
    [state.isOpen],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!state.isOpen) return;

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          if (
            state.focusedIndex >= 0 &&
            state.focusedIndex < filteredOptions.length
          ) {
            const option = filteredOptions[state.focusedIndex];
            if (option) handleOptionClick(option.value);
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          dispatch({
            type: "SET_FOCUSED",
            payload:
              state.focusedIndex < filteredOptions.length - 1
                ? state.focusedIndex + 1
                : 0,
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          dispatch({
            type: "SET_FOCUSED",
            payload:
              state.focusedIndex > 0
                ? state.focusedIndex - 1
                : filteredOptions.length - 1,
          });
          break;
        case "Escape":
        case "Tab":
          event.preventDefault();
          dispatch({ type: "CLOSE" });
          break;
      }
    },
    [state.isOpen, state.focusedIndex, filteredOptions, handleOptionClick],
  );

  const handleTriggerClick = useCallback(() => {
    if (!disabled) {
      dispatch({ type: "TOGGLE" });
    }
  }, [disabled]);

  return (
    <div ref={containerRef} className={classNames(styles.container, className)}>
      {showLabel ? (
        <span id={labelId} className={styles.label} data-filter-field-label>
          {label}
        </span>
      ) : null}
      {showClearButton ? (
        <div className={styles.controlRow}>
          <AutocompleteTrigger
            ref={anchorRef}
            label={label}
            labelId={showLabel ? labelId : undefined}
            showLabel={showLabel}
            disabled={disabled}
            isOpen={state.isOpen}
            listboxId={listboxId}
            displayValue={getDisplayValue()}
            selectedOptions={getSelectedOptions()}
            multiple={multiple}
            value={value}
            onTriggerClick={handleTriggerClick}
            onTriggerKeyDown={handleTriggerKeyDown}
            onClearOption={handleClearOption}
            placeholder={placeholder}
            anchorStyle={anchorStyle}
            className={styles.triggerWithClear}
          />
          <Button
            variant="secondary"
            size="md"
            className={styles.clearButton}
            onPress={handleClearAll}
            aria-label={`Clear ${label}`}
          >
            Clear
          </Button>
        </div>
      ) : (
        <AutocompleteTrigger
          ref={anchorRef}
          label={label}
          labelId={showLabel ? labelId : undefined}
          showLabel={showLabel}
          disabled={disabled}
          isOpen={state.isOpen}
          listboxId={listboxId}
          displayValue={getDisplayValue()}
          selectedOptions={getSelectedOptions()}
          multiple={multiple}
          value={value}
          onTriggerClick={handleTriggerClick}
          onTriggerKeyDown={handleTriggerKeyDown}
          onClearOption={handleClearOption}
          placeholder={placeholder}
          anchorStyle={anchorStyle}
        />
      )}
      {state.isOpen ? (
        <AutocompleteDropdown
          listboxId={listboxId}
          label={label}
          searchTerm={state.searchTerm}
          filteredOptions={filteredOptions}
          focusedIndex={state.focusedIndex}
          openUpward={state.openUpward}
          value={value}
          onSearchChange={handleInputChange}
          onOptionClick={handleOptionClick}
          onInputKeyDown={handleInputKeyDown}
          inputRef={inputRef}
          dropdownRef={dropdownRef}
          listboxRef={listboxRef}
          anchorStyle={anchorStyle}
        />
      ) : null}
    </div>
  );
};

export const AutocompleteSelect = memo(AutocompleteSelectComponent);
