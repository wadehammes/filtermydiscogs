"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import classNames from "classnames";
import { memo, useCallback } from "react";
import Button from "src/components/Button/Button.component";
import {
  useOverlayStackPositionerStyle,
  usePortaledOverlayContainer,
} from "src/components/OverlayStack/OverlayStack.component";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import { definedProps } from "src/utils/definedProps";
import {
  applyFilterValueChange,
  getFilterControlledValue,
} from "src/utils/filterControlValue";
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

type SelectItem = {
  value: string;
  label: string;
  isDefault?: boolean;
};

const getSelectItems = (options: SelectOption[]): SelectItem[] =>
  options.map(({ value, label, isDefault }) => ({
    value,
    label,
    ...definedProps({ isDefault }),
  }));

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
  const overlayContainer = usePortaledOverlayContainer();
  const positionerStyle = useOverlayStackPositionerStyle();

  const hasSelectedValues =
    multiple && Array.isArray(value) && value.length > 0;
  const showClearButton = clearable && hasSelectedValues && !disabled;
  const selectItems = getSelectItems(options);
  const controlledValue = getFilterControlledValue(value, multiple);

  const selectedSingleOption =
    !multiple && typeof value === "string"
      ? options.find((option) => option.value === value)
      : undefined;

  const handleValueChange = useCallback(
    (newValue: string | string[] | null) => {
      applyFilterValueChange({ multiple, onChange, newValue });
    },
    [multiple, onChange],
  );

  const handleClear = useCallback(() => {
    onChange([]);
  }, [onChange]);

  const renderValue = useCallback(
    (selectedValue: string | string[] | null) => {
      if (multiple) {
        const selectedValues = Array.isArray(selectedValue)
          ? selectedValue
          : [];

        if (selectedValues.length === 0) {
          return placeholder ?? "";
        }

        return selectedValues.join(", ");
      }

      if (typeof selectedValue !== "string") {
        return placeholder ?? "";
      }

      const option = options.find((item) => item.value === selectedValue);
      return option?.label ?? placeholder ?? "";
    },
    [multiple, options, placeholder],
  );

  const trigger = (
    <BaseSelect.Trigger
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
      <span className={styles.value}>
        <BaseSelect.Value
          className={styles.valueText}
          placeholder={placeholder}
        >
          {renderValue}
        </BaseSelect.Value>
        {selectedSingleOption?.isDefault ? (
          <span className={styles.defaultBadge}>Default</span>
        ) : null}
      </span>
      <span className={styles.icon}>
        <ChevronRightThinIcon />
      </span>
    </BaseSelect.Trigger>
  );

  return (
    <div
      className={classNames(styles.container, className)}
      data-testid="fmdSelect"
    >
      <BaseSelect.Root
        items={selectItems}
        value={controlledValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        modal={false}
        {...definedProps({ multiple: multiple ? true : undefined })}
      >
        {showLabel ? (
          <BaseSelect.Label className={styles.label} data-filter-field-label>
            {label}
          </BaseSelect.Label>
        ) : null}
        {clearable ? (
          <div className={styles.controlRow}>
            {trigger}
            {showClearButton ? (
              <Button
                variant="secondary"
                size="md"
                className={styles.clearButton}
                onPress={handleClear}
                aria-label={`Clear ${label}`}
              >
                Clear
              </Button>
            ) : null}
          </div>
        ) : (
          trigger
        )}
        {options.length > 0 ? (
          <BaseSelect.Portal {...definedProps({ container: overlayContainer })}>
            <BaseSelect.Positioner
              alignItemWithTrigger={false}
              className={styles.positioner}
              sideOffset={4}
              style={positionerStyle}
            >
              <BaseSelect.Popup className={styles.popup}>
                <BaseSelect.List className={styles.listbox} aria-label={label}>
                  {options.map((option) => (
                    <BaseSelect.Item
                      key={option.value}
                      value={option.value}
                      className={styles.option}
                    >
                      <span className={styles.optionContent}>
                        <BaseSelect.ItemIndicator className={styles.checkmark}>
                          <CheckThinIcon />
                        </BaseSelect.ItemIndicator>
                        <span className={styles.optionLabel}>
                          <BaseSelect.ItemText>
                            {option.label}
                          </BaseSelect.ItemText>
                          {option.isDefault ? (
                            <span className={styles.defaultBadge}>Default</span>
                          ) : null}
                        </span>
                      </span>
                    </BaseSelect.Item>
                  ))}
                </BaseSelect.List>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        ) : null}
      </BaseSelect.Root>
    </div>
  );
};

const Select = memo(SelectComponent);
export default Select;
