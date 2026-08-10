import classNames from "classnames";
import { memo, useCallback, useEffect, useId, useReducer, useRef } from "react";
import Button from "src/components/Button/Button.component";
import { AnchoredPopoverPortal } from "src/components/shared/AnchoredPopoverPortal/AnchoredPopoverPortal.component";
import { CheckThinIcon } from "src/components/shared/icons/CheckThinIcon.component";
import { ChevronRightThinIcon } from "src/components/shared/icons/ChevronRightThinIcon.component";
import { useAnchoredPopoverLayout } from "src/hooks/useAnchoredPopoverLayout.hook";
import anchoredPopoverStyles from "src/styles/anchored-popover.module.css";
import {
  estimateSelectMenuHeight,
  shouldOpenPopoverUpward,
} from "src/utils/popoverPlacement";
import { isOptionSelected } from "src/utils/selectHelpers";
import styles from "./Select.module.css";

interface SelectOption {
  value: string;
  label: string;
  isDefault?: boolean;
}

interface SelectProps {
  label: string;
  options: SelectOption[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  clearable?: boolean;
}

type SelectState = {
  isOpen: boolean;
  focusedIndex: number;
  openUpward: boolean;
};

type SelectAction =
  | { type: "CLOSE" }
  | { type: "OPEN" }
  | { type: "TOGGLE" }
  | { type: "SET_FOCUSED"; payload: number }
  | { type: "SET_OPEN_UPWARD"; payload: boolean };

const initialState: SelectState = {
  isOpen: false,
  focusedIndex: -1,
  openUpward: false,
};

function selectReducer(state: SelectState, action: SelectAction): SelectState {
  switch (action.type) {
    case "CLOSE":
      return { ...state, isOpen: false, focusedIndex: -1 };
    case "OPEN":
      return { ...state, isOpen: true, focusedIndex: -1 };
    case "TOGGLE":
      return state.isOpen
        ? { ...state, isOpen: false, focusedIndex: -1 }
        : { ...state, isOpen: true, focusedIndex: -1 };
    case "SET_FOCUSED":
      return { ...state, focusedIndex: action.payload };
    case "SET_OPEN_UPWARD":
      return { ...state, openUpward: action.payload };
    default:
      return state;
  }
}

const SelectComponent = ({
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
}: SelectProps) => {
  const labelId = useId();
  const [state, dispatch] = useReducer(selectReducer, initialState);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { anchorStyle } = useAnchoredPopoverLayout({
    isOpen: state.isOpen,
    openUpward: state.openUpward,
    anchorRef,
    panelRef,
  });

  const hasSelectedValues =
    multiple && Array.isArray(value) && value.length > 0;
  const showClearButton = clearable && hasSelectedValues && !disabled;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        containerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      dispatch({ type: "CLOSE" });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (state.isOpen && anchorRef.current) {
      dispatch({
        type: "SET_OPEN_UPWARD",
        payload: shouldOpenPopoverUpward({
          trigger: anchorRef.current,
          estimatedMenuHeight: estimateSelectMenuHeight(options.length),
        }),
      });
    }
  }, [state.isOpen, options.length]);

  const getDisplayValue = useCallback((): string => {
    if (!value) return placeholder || "";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : placeholder || "";
    }
    const option = options.find((opt) => opt.value === value);
    return option?.label || placeholder || "";
  }, [value, placeholder, options]);

  const handleClear = useCallback(() => {
    onChange([]);
    dispatch({ type: "CLOSE" });
  }, [onChange]);

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

  const handleKeyDown = useCallback(
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
        return;
      }

      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          if (state.focusedIndex >= 0 && state.focusedIndex < options.length) {
            const option = options[state.focusedIndex];
            if (option) {
              handleOptionClick(option.value);
            }
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          dispatch({
            type: "SET_FOCUSED",
            payload:
              state.focusedIndex < options.length - 1
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
                : options.length - 1,
          });
          break;
        case "Escape":
        case "Tab":
          dispatch({ type: "CLOSE" });
          break;
      }
    },
    [state.isOpen, state.focusedIndex, options, handleOptionClick],
  );

  const trigger = (
    <button
      ref={anchorRef}
      className={classNames(
        styles.trigger,
        showClearButton && styles.triggerWithClear,
        anchoredPopoverStyles.popoverAnchor,
      )}
      style={anchorStyle}
      type="button"
      aria-labelledby={showLabel ? labelId : undefined}
      aria-label={showLabel ? undefined : label}
      data-filter-control-trigger
      aria-haspopup="listbox"
      aria-expanded={state.isOpen}
      onClick={() => !disabled && dispatch({ type: "TOGGLE" })}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      <span className={styles.value}>
        <span className={styles.valueText}>{getDisplayValue()}</span>
        {(() => {
          const selectedOption = options.find(
            (opt) => opt.value === (Array.isArray(value) ? value[0] : value),
          );
          return selectedOption?.isDefault ? (
            <span className={styles.defaultBadge}>Default</span>
          ) : null;
        })()}
      </span>
      <span
        className={classNames(styles.icon, {
          [styles.iconOpen]: state.isOpen,
        })}
      >
        <ChevronRightThinIcon />
      </span>
    </button>
  );

  return (
    <div
      ref={containerRef}
      className={classNames(styles.container, className)}
      data-testid="fmdSelect"
    >
      {showLabel ? (
        <span id={labelId} className={styles.label} data-filter-field-label>
          {label}
        </span>
      ) : null}
      {showClearButton ? (
        <div className={styles.controlRow}>
          {trigger}
          <Button
            variant="secondary"
            size="md"
            className={styles.clearButton}
            onPress={handleClear}
            aria-label={`Clear ${label}`}
          >
            Clear
          </Button>
        </div>
      ) : (
        trigger
      )}
      {state.isOpen && options.length > 0 ? (
        <AnchoredPopoverPortal>
          <div
            ref={panelRef}
            style={anchorStyle}
            className={classNames(
              anchoredPopoverStyles.popoverPanel,
              styles.listboxPanel,
              {
                [anchoredPopoverStyles.popoverPanelUpward]: state.openUpward,
              },
            )}
          >
            <ul
              ref={listboxRef}
              className={styles.listbox}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: <ul> with role="listbox" is valid ARIA pattern
              role="listbox"
              aria-label={label}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: <li> with role="option" is valid ARIA pattern
                  role="option"
                  aria-selected={isOptionSelected(value, option.value)}
                  className={classNames(styles.option, {
                    [styles.selected]: isOptionSelected(value, option.value),
                    [styles.focused]: state.focusedIndex === index,
                  })}
                  tabIndex={state.focusedIndex === index ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(option.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOptionClick(option.value);
                    }
                  }}
                >
                  <span className={styles.optionContent}>
                    {isOptionSelected(value, option.value) && (
                      <span className={styles.checkmark}>
                        <CheckThinIcon />
                      </span>
                    )}
                    <span className={styles.optionLabel}>
                      <span>{option.label}</span>
                      {option.isDefault && (
                        <span className={styles.defaultBadge}>Default</span>
                      )}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </AnchoredPopoverPortal>
      ) : null}
    </div>
  );
};

const Select = memo(SelectComponent);
export default Select;
