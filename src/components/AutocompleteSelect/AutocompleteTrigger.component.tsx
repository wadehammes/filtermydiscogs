import classNames from "classnames";
import Chevron from "src/styles/icons/chevron-right-thin.svg";
import type { AutocompleteOption } from "./AutocompleteSelect.component";
import styles from "./AutocompleteSelect.module.css";

interface AutocompleteTriggerProps {
  label: string;
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
}

export function AutocompleteTrigger({
  label,
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
}: AutocompleteTriggerProps) {
  const isEmpty = multiple
    ? !Array.isArray(value) || value.length === 0
    : !value;
  const showPlaceholder = isEmpty && Boolean(placeholder);

  return (
    <div
      className={classNames(styles.trigger, {
        [styles.disabled]: disabled,
      })}
      role="combobox"
      aria-controls={isOpen ? listboxId : undefined}
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
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
        <Chevron />
      </span>
    </div>
  );
}
