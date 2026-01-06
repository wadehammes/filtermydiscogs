import classNames from "classnames";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import Check from "src/styles/icons/check-solid.svg";
import Chevron from "src/styles/icons/chevron-right-solid.svg";
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
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const getDisplayValue = useCallback((): string => {
    if (!value) return placeholder || "";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : placeholder || "";
    }
    const option = options.find((opt) => opt.value === value);
    return option?.label || placeholder || "";
  }, [value, placeholder, options]);

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
      }
    },
    [multiple, value, onChange],
  );

  const handleKeyDown = useCallback(
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
        return;
      }

      switch (event.key) {
        case "Enter":
        case " ":
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < options.length) {
            const option = options[focusedIndex];
            if (option) {
              handleOptionClick(option.value);
            }
          }
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          event.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
        case "Tab":
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [isOpen, options, focusedIndex, handleOptionClick],
  );

  const isOptionSelected = (optionValue: string): boolean => {
    if (Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  return (
    <div ref={containerRef} className={classNames(styles.container, className)}>
      <button
        className={styles.trigger}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
        <span className={classNames(styles.icon, isOpen && styles.iconOpen)}>
          <Chevron />
        </span>
      </button>
      {isOpen && options.length > 0 && (
        <ul ref={listboxRef} className={styles.listbox} aria-label={label}>
          {options.map((option, index) => (
            <li
              key={option.value}
              className={classNames(
                styles.option,
                isOptionSelected(option.value) && styles.selected,
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
                {isOptionSelected(option.value) && (
                  <span className={styles.checkmark}>
                    <Check />
                  </span>
                )}
                <span className={styles.optionLabel}>
                  {option.label}
                  {option.isDefault && (
                    <span className={styles.defaultBadge}>Default</span>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const Select = memo(SelectComponent);
export default Select;
