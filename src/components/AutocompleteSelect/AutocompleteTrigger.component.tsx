import classNames from "classnames";
import { forwardRef } from "react";
import { ChevronRightThinIcon } from "src/components/shared/icons/ChevronRightThinIcon.component";
import anchoredPopoverStyles from "src/styles/anchored-popover.module.css";
import type { AutocompleteOption } from "./AutocompleteSelect.component";
import styles from "./AutocompleteSelect.module.css";

interface AutocompleteTriggerProps {
  label: string;
  labelId?: string | undefined;
  showLabel?: boolean;
  disabled: boolean;
  isOpen: boolean;
  listboxId: string;
  displayValue: string;
  selectedOptions: AutocompleteOption[];
  multiple: boolean;
  onTriggerClick: () => void;
  onTriggerKeyDown: (e: React.KeyboardEvent) => void;
  onClearOption: (
    value: string,
    e: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  value?: string | string[] | undefined;
  placeholder?: string | undefined;
  anchorStyle?: React.CSSProperties;
  className?: string | undefined;
}

export const AutocompleteTrigger = forwardRef<
  HTMLDivElement,
  AutocompleteTriggerProps
>(function AutocompleteTrigger(
  {
    label,
    labelId,
    showLabel = false,
    disabled,
    isOpen,
    listboxId,
    displayValue,
    selectedOptions,
    multiple,
    onTriggerClick,
    onTriggerKeyDown,
    onClearOption,
    value,
    placeholder,
    anchorStyle,
    className,
  },
  ref,
) {
  const isEmpty = multiple
    ? !Array.isArray(value) || value.length === 0
    : !value;
  const showPlaceholder = isEmpty && Boolean(placeholder);

  return (
    <div
      ref={ref}
      style={anchorStyle}
      className={classNames(
        styles.trigger,
        anchoredPopoverStyles.popoverAnchor,
        className,
        {
          [styles.disabled]: disabled,
        },
      )}
      role="combobox"
      aria-controls={isOpen ? listboxId : undefined}
      aria-labelledby={showLabel ? labelId : undefined}
      aria-label={showLabel ? undefined : label}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      data-filter-control-trigger
      onClick={onTriggerClick}
      onKeyDown={onTriggerKeyDown}
      tabIndex={disabled ? -1 : 0}
    >
      <div className={styles.valueContainer}>
        {multiple && Array.isArray(value) && value.length > 0 ? (
          <div className={styles.pillsContainer}>
            {selectedOptions.map((option) => (
              <span key={option.value} className={styles.pill}>
                <span className={styles.pillLabel}>{option.label}</span>
                <button
                  type="button"
                  className={styles.pillClear}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onClearOption(option.value, e);
                  }}
                  aria-label={`Remove ${option.label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className={showPlaceholder ? styles.placeholder : styles.value}>
            {displayValue}
          </span>
        )}
      </div>
      <span
        className={classNames(styles.icon, {
          [styles.iconOpen]: isOpen,
        })}
      >
        <ChevronRightThinIcon />
      </span>
    </div>
  );
});
