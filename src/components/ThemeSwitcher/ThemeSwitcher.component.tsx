"use client";

import { Menu } from "@base-ui/react/menu";
import { use } from "react";
import { browser } from "react-dom";
import { IconButton } from "src/components/IconButton/IconButton.component";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import Select from "src/components/Select/Select.component";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import { useTheme } from "src/hooks/useTheme.hook";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import Moon from "src/styles/icons/moon-thin.svg";
import Sun from "src/styles/icons/sun-thin.svg";
import type { StoredTheme } from "src/types/userPreferences.types";
import { definedProps } from "src/utils/definedProps";
import {
  cycleTheme,
  STORED_THEMES,
  THEME_LABELS,
  themeUsesDarkAssets,
} from "src/utils/themeAppearance";
import styles from "./ThemeSwitcher.module.css";

const THEME_OPTIONS = STORED_THEMES.map((value) => ({
  value,
  label: THEME_LABELS[value],
}));

interface ThemeSwitcherProps {
  variant?: "desktop" | "mobile" | "dropdown" | "menu";
  className?: string;
  onThemePersisted?: () => void;
  onThemePersistError?: () => void;
}

export const ThemeSwitcher = ({
  variant = "desktop",
  className,
  onThemePersisted,
  onThemePersistError,
}: ThemeSwitcherProps) => {
  use(browser());
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { persistPreferences } = usePersistUserPreferences();

  const handleThemeChange = (nextTheme: StoredTheme) => {
    setTheme(nextTheme);
    persistPreferences(
      { theme: nextTheme },
      {
        onSuccess: () => {
          onThemePersisted?.();
        },
        onError: () => {
          onThemePersistError?.();
        },
      },
    );
  };

  const getLabel = () => THEME_LABELS[theme];

  if (variant === "menu") {
    return (
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger className={inlinePopoverMenuStyles.item}>
          <span className={styles.submenuLabel}>Theme</span>
          <span className={styles.submenuValue}>{getLabel()}</span>
          <ChevronRightThinIcon className={styles.submenuChevron} />
        </Menu.SubmenuTrigger>
        <InlinePopoverMenu.Panel
          popupClassName={styles.submenuPopup}
          scrollable
          useOverlayStack={false}
          variant="submenu"
        >
          <InlinePopoverMenu.List>
            <Menu.RadioGroup
              className={inlinePopoverMenuStyles.itemGroup}
              value={theme}
              onValueChange={(value) => {
                handleThemeChange(value as StoredTheme);
              }}
            >
              {THEME_OPTIONS.map(({ value, label }) => (
                <Menu.RadioItem
                  key={value}
                  className={inlinePopoverMenuStyles.item}
                  label={label}
                  value={value}
                >
                  <Menu.RadioItemIndicator className={styles.radioIndicator}>
                    <CheckThinIcon className={styles.radioCheck} />
                  </Menu.RadioItemIndicator>
                  {label}
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </InlinePopoverMenu.List>
        </InlinePopoverMenu.Panel>
      </Menu.SubmenuRoot>
    );
  }

  if (variant === "dropdown") {
    return (
      <Select
        label="Theme"
        options={THEME_OPTIONS}
        value={theme}
        onChange={(value) => {
          handleThemeChange(value as StoredTheme);
        }}
        placeholder="Select theme"
        {...definedProps({ className })}
      />
    );
  }

  const handleThemeToggle = () => {
    handleThemeChange(cycleTheme(theme));
  };

  const getIcon = () => {
    return themeUsesDarkAssets(resolvedTheme) ? (
      <Moon className={styles.iconSvg} />
    ) : (
      <Sun className={styles.iconSvg} />
    );
  };

  const containerClass =
    variant === "mobile" ? styles.mobileButton : styles.desktopButton;

  return (
    <IconButton
      className={containerClass}
      iconClassName={styles.icon}
      label={variant === "desktop" ? getLabel() : undefined}
      labelClassName={styles.label}
      onClick={handleThemeToggle}
      aria-label={`Switch theme (current: ${getLabel()})`}
      title={`Theme: ${getLabel()}`}
    >
      {getIcon()}
    </IconButton>
  );
};
