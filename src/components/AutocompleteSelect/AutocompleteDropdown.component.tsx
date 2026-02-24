import classNames from "classnames";
import Check from "src/styles/icons/check-solid.svg";
import { isOptionSelected } from "src/utils/selectHelpers";
import styles from "./AutocompleteSelect.module.css";

interface AutocompleteOption {
  value: string;
  label: string;
}

interface AutocompleteDropdownProps {
  listboxId: string;
  label: string;
  searchTerm: string;
  filteredOptions: AutocompleteOption[];
  focusedIndex: number;
  openUpward: boolean;
  value?: string | string[] | undefined;
  onSearchChange: (value: string) => void;
  onOptionClick: (value: string) => void;
  onInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  listboxRef: React.RefObject<HTMLUListElement | null>;
}

export function AutocompleteDropdown({
  listboxId,
  label,
  searchTerm,
  filteredOptions,
  focusedIndex,
  openUpward,
  value,
  onSearchChange,
  onOptionClick,
  onInputKeyDown,
  inputRef,
  dropdownRef,
  listboxRef,
}: AutocompleteDropdownProps) {
  return (
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
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onInputKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      {filteredOptions.length > 0 ? (
        <ul
          ref={listboxRef}
          id={listboxId}
          className={styles.listbox}
          aria-label={label}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              className={classNames(
                styles.option,
                isOptionSelected(value, option.value) && styles.selected,
                focusedIndex === index && styles.focused,
              )}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => onOptionClick(option.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOptionClick(option.value);
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
        <div className={styles.noResults}>No {label.toLowerCase()} found</div>
      )}
    </div>
  );
}
