"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { type CSSProperties, useState } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import {
  CRATE_SECTION_ACCENT_KEYS,
  type CrateSectionAccentKey,
} from "src/constants/crateSectionAccent";
import { crateSectionAccentCssVar } from "src/lib/crate-section-layout";
import { definedProps } from "src/utils/definedProps";
import styles from "./CrateSectionAccentPicker.module.css";

interface CrateSectionAccentPickerProps {
  value: string | null;
  disabled?: boolean;
  onChange: (accentKey: CrateSectionAccentKey | null) => void;
}

export const CrateSectionAccentPicker = ({
  value,
  disabled = false,
  onChange,
}: CrateSectionAccentPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (accentKey: CrateSectionAccentKey | null) => {
    onChange(accentKey);
    setIsOpen(false);
  };

  return (
    <Menu.Root open={isOpen} onOpenChange={setIsOpen}>
      <Menu.Trigger
        disabled={disabled}
        render={(props) => (
          <button
            {...props}
            type="button"
            className={classNames(styles.trigger, {
              [styles.triggerTinted]: Boolean(value),
            })}
            {...definedProps(
              value
                ? {
                    style: {
                      "--crate-section-accent": crateSectionAccentCssVar(value),
                    } as CSSProperties,
                  }
                : {},
            )}
            aria-label="Section color"
            aria-haspopup="menu"
          >
            <span className={styles.triggerSwatch} aria-hidden="true" />
          </button>
        )}
      />
      <InlinePopoverMenu.Panel align="end" side="bottom" sideOffset={6}>
        <fieldset className={styles.picker} aria-label="Section color">
          <IconButton
            variant="skip"
            className={classNames(styles.swatch, styles.swatchClear, {
              [styles.swatchSelected]: !value,
            })}
            disabled={disabled}
            aria-label="Default section color"
            aria-pressed={!value}
            onClick={() => handleSelect(null)}
          />
          {CRATE_SECTION_ACCENT_KEYS.map((accentKey) => (
            <IconButton
              key={accentKey}
              variant="skip"
              className={classNames(styles.swatch, {
                [styles.swatchSelected]: value === accentKey,
              })}
              style={
                {
                  "--crate-section-accent": crateSectionAccentCssVar(accentKey),
                } as CSSProperties
              }
              disabled={disabled}
              aria-label={`${accentKey} section color`}
              aria-pressed={value === accentKey}
              onClick={() => handleSelect(accentKey)}
            />
          ))}
        </fieldset>
      </InlinePopoverMenu.Panel>
    </Menu.Root>
  );
};
