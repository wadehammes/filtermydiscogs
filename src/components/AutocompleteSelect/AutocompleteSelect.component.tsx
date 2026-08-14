"use client";

import { Combobox } from "@base-ui/react/combobox";
import classNames from "classnames";
import type { KeyboardEvent, MouseEvent } from "react";
import { memo, useCallback, useMemo, useRef } from "react";
import Button from "src/components/Button/Button.component";
import { CheckThinIcon } from "src/components/shared/icons/CheckThinIcon.component";
import { ChevronRightThinIcon } from "src/components/shared/icons/ChevronRightThinIcon.component";
import { useFilterControlPositionerZIndex } from "src/hooks/useFilterControlPositionerZIndex.hook";
import { definedProps } from "src/utils/definedProps";
import {
  applyFilterValueChange,
  getFilterControlledValue,
} from "src/utils/filterControlValue";
import styles from "./AutocompleteSelect.module.css";

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

const getComboboxItems = (options: AutocompleteOption[]) =>
  options.map(({ value, label }) => ({ value, label }));

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
  const anchorRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { positionerStyle, handleOpenChange } =
    useFilterControlPositionerZIndex(anchorRef);

  const comboboxItems = getComboboxItems(options);
  const controlledValue = getFilterControlledValue(value, multiple);

  const hasSelectedValues =
    multiple && Array.isArray(value) && value.length > 0;

  const assignTriggerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;

      if (!hasSelectedValues) {
        anchorRef.current = node;
      }
    },
    [hasSelectedValues],
  );

  const showClearButton = clearable && hasSelectedValues && !disabled;

  const selectedOptions = useMemo((): AutocompleteOption[] => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return options.filter((option) => value.includes(option.value));
    }

    const option = options.find((item) => item.value === value);
    return option ? [option] : [];
  }, [options, value]);

  const handleValueChange = useCallback(
    (newValue: string | string[] | null) => {
      applyFilterValueChange({ multiple, onChange, newValue });
    },
    [multiple, onChange],
  );

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const handleClearOption = useCallback(
    (
      optionValue: string,
      event: MouseEvent | KeyboardEvent<HTMLButtonElement>,
    ) => {
      if ("key" in event && event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.stopPropagation();
      event.preventDefault();

      if (multiple && Array.isArray(value)) {
        onChange(value.filter((item) => item !== optionValue));
      }
    },
    [multiple, onChange, value],
  );

  const renderSingleValue = useCallback(
    (selected: string | null) => {
      if (typeof selected !== "string") {
        return placeholder ?? "";
      }

      const option = options.find((item) => item.value === selected);
      return option?.label ?? placeholder ?? "";
    },
    [options, placeholder],
  );

  const triggerIcon = (
    <span className={styles.icon}>
      <ChevronRightThinIcon />
    </span>
  );

  const multipleTrigger =
    selectedOptions.length === 0 ? (
      <Combobox.Trigger
        ref={assignTriggerRef}
        className={classNames(
          styles.trigger,
          showClearButton && styles.triggerWithClear,
        )}
        data-filter-control-trigger
        disabled={disabled}
        {...definedProps({
          "aria-label": showLabel ? undefined : label,
        })}
      >
        <span className={styles.placeholder}>{placeholder}</span>
        {triggerIcon}
      </Combobox.Trigger>
    ) : (
      <div
        ref={(node) => {
          anchorRef.current = node;
        }}
        className={classNames(
          styles.triggerShell,
          showClearButton && styles.triggerWithClear,
        )}
        data-filter-control-trigger
      >
        <Combobox.Trigger
          ref={assignTriggerRef}
          className={styles.triggerOverlay}
          disabled={disabled}
          {...definedProps({
            "aria-label": showLabel ? undefined : label,
          })}
        >
          {triggerIcon}
        </Combobox.Trigger>
        <div className={styles.valueContainer}>
          <div className={styles.pillsContainer}>
            {selectedOptions.map((option) => (
              <span key={option.value} className={styles.pill}>
                <span className={styles.pillLabel}>{option.label}</span>
                <button
                  type="button"
                  className={styles.pillClear}
                  onClick={(event) => {
                    handleClearOption(option.value, event);
                  }}
                  onKeyDown={(event) => {
                    handleClearOption(option.value, event);
                  }}
                  aria-label={`Remove ${option.label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    );

  const singleTrigger = (
    <Combobox.Trigger
      ref={assignTriggerRef}
      className={classNames(
        styles.trigger,
        showClearButton && styles.triggerWithClear,
      )}
      data-filter-control-trigger
      disabled={disabled}
      {...definedProps({
        "aria-label": showLabel ? undefined : label,
      })}
    >
      <div className={styles.valueContainer}>
        <Combobox.Value placeholder={placeholder}>
          {(selected) => (
            <span className={styles.value}>{renderSingleValue(selected)}</span>
          )}
        </Combobox.Value>
      </div>
      {triggerIcon}
    </Combobox.Trigger>
  );

  const trigger = multiple ? multipleTrigger : singleTrigger;

  return (
    <div
      className={classNames(styles.container, className)}
      data-testid="fmdAutocompleteSelect"
    >
      <Combobox.Root
        items={comboboxItems}
        value={controlledValue}
        onValueChange={handleValueChange}
        onOpenChange={handleOpenChange}
        disabled={disabled}
        modal={false}
        {...definedProps({ multiple: multiple ? true : undefined })}
      >
        {showLabel ? (
          <Combobox.Label className={styles.label} data-filter-field-label>
            {label}
          </Combobox.Label>
        ) : null}
        {showClearButton ? (
          <div className={styles.controlRow}>
            {trigger}
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
          trigger
        )}
        <Combobox.Portal>
          <Combobox.Positioner
            anchor={anchorRef}
            className={styles.positioner}
            sideOffset={4}
            style={positionerStyle}
          >
            <Combobox.Popup className={styles.popup} aria-label={label}>
              <div className={styles.searchContainer}>
                <Combobox.Input
                  className={styles.searchInput}
                  placeholder={`Search ${label.toLowerCase()}...`}
                />
              </div>
              <Combobox.Empty className={styles.noResults}>
                No {label.toLowerCase()} found
              </Combobox.Empty>
              <Combobox.List className={styles.listbox}>
                {(option: AutocompleteOption) => (
                  <Combobox.Item
                    key={option.value}
                    value={option.value}
                    className={styles.option}
                  >
                    <span className={styles.optionContent}>
                      <Combobox.ItemIndicator className={styles.checkmark}>
                        <CheckThinIcon />
                      </Combobox.ItemIndicator>
                      <span className={styles.optionLabel}>{option.label}</span>
                    </span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
};

export const AutocompleteSelect = memo(AutocompleteSelectComponent);
