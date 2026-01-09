import classNames from "classnames";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import Check from "src/styles/icons/check-solid.svg";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
import { isOptionSelected } from "src/utils/selectHelpers";
import styles from "./AutocompleteSelect.module.css";

interface AutocompleteOption {
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
}: AutocompleteSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search term and focus when opening the dropdown
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
      setSearchTerm("");
      // Focus the input when opening
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // Calculate dropdown position when it opens or filtered options change
  useEffect(() => {
    if (isOpen && containerRef.current && dropdownRef.current) {
      const triggerRect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const estimatedMenuHeight = Math.min(
        250,
        filteredOptions.length * 40 + 60,
      ); // max-height + search input

      // Open upward if there's not enough space below (with some buffer)
      setOpenUpward(spaceBelow < estimatedMenuHeight + 20);
    }
  }, [isOpen, filteredOptions.length]);

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
          const newValue = currentValue.filter((v) => v !== optionValue);
          onChange(newValue);
        } else {
          onChange([...currentValue, optionValue]);
        }
      } else {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
      }
    },
    [multiple, value, onChange],
  );

  const handleClearOption = useCallback(
    (optionValue: string, event: React.MouseEvent | React.KeyboardEvent) => {
      event.stopPropagation();
      if (multiple) {
        const currentValue = Array.isArray(value) ? value : [];
        const newValue = currentValue.filter((v) => v !== optionValue);
        onChange(newValue);
      }
    },
    [multiple, value, onChange],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setFocusedIndex(-1);
      if (!isOpen) {
        setIsOpen(true);
      }
    },
    [isOpen],
  );

  const handleTriggerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "ArrowDown"
        ) {
          event.preventDefault();
          setIsOpen(true);
        }
      }
    },
    [isOpen],
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        return;
      }

      switch (event.key) {
        case "Enter":
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            const option = filteredOptions[focusedIndex];
            if (option) {
              handleOptionClick(option.value);
            }
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          setSearchTerm("");
          break;
        case "Tab":
          setIsOpen(false);
          setFocusedIndex(-1);
          setSearchTerm("");
          break;
        default:
          // Allow all other keys (typing) to work normally
          break;
      }
    },
    [isOpen, filteredOptions, focusedIndex, handleOptionClick],
  );

  const handleTriggerClick = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen]);

  return (
    <div ref={containerRef} className={classNames(styles.container, className)}>
      <div
        className={classNames(styles.trigger, disabled && styles.disabled)}
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        tabIndex={disabled ? -1 : 0}
      >
        <div className={styles.valueContainer}>
          {multiple && Array.isArray(value) && value.length > 0 ? (
            <div className={styles.pillsContainer}>
              {getSelectedOptions().map((option) => (
                <span key={option.value} className={styles.pill}>
                  <span className={styles.pillLabel}>{option.label}</span>
                  <button
                    type="button"
                    className={styles.pillClear}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleClearOption(option.value, e);
                    }}
                    aria-label={`Remove ${option.label}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className={styles.value}>{getDisplayValue()}</span>
          )}
        </div>
        <span className={classNames(styles.icon, isOpen && styles.iconOpen)}>
          <Chevron />
        </span>
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className={classNames(
            styles.dropdown,
            openUpward && styles.dropdownUpward,
          )}
        >
          <div className={styles.searchContainer}>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {filteredOptions.length > 0 ? (
            <ul ref={listboxRef} className={styles.listbox} aria-label={label}>
              {filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  className={classNames(
                    styles.option,
                    isOptionSelected(value, option.value) && styles.selected,
                    focusedIndex === index && styles.focused,
                  )}
                  tabIndex={focusedIndex === index ? 0 : -1}
                  onClick={() => handleOptionClick(option.value)}
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
                        <Check />
                      </span>
                    )}
                    <span className={styles.optionLabel}>{option.label}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.noResults}>
              No {label.toLowerCase()} found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AutocompleteSelect = memo(AutocompleteSelectComponent);
export default AutocompleteSelect;
