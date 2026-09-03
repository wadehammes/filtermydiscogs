"use client";

import { Menu } from "@base-ui/react/menu";
import Select from "src/components/Select/Select.component";
import { useMounted } from "src/hooks/useMounted.hook";
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
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { persistPreferences } = usePersistUserPreferences();
  const mounted = useMounted();

  const activeTheme = mounted ? theme : "light";

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

  const getLabel = () => (mounted ? THEME_LABELS[theme] : "Light");

  if (variant === "menu") {
    return (
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger className={styles.submenuTrigger}>
          <span className={styles.submenuLabel}>Theme</span>
          <span className={styles.submenuValue} suppressHydrationWarning>
            {getLabel()}
          </span>
          <ChevronRightThinIcon className={styles.submenuChevron} />
        </Menu.SubmenuTrigger>
        <Menu.Portal>
          <Menu.Positioner
            align="start"
            className={styles.submenuPositioner}
            sideOffset={4}
          >
            <Menu.Popup className={styles.submenuPopup}>
              <div className={styles.submenuList}>
                <Menu.RadioGroup
                  className={styles.itemGroup}
                  value={activeTheme}
                  onValueChange={(value) => {
                    handleThemeChange(value as StoredTheme);
                  }}
                >
                  {THEME_OPTIONS.map(({ value, label }) => (
                    <Menu.RadioItem
                      key={value}
                      className={styles.radioItem}
                      label={label}
                      value={value}
                    >
                      <Menu.RadioItemIndicator
                        className={styles.radioIndicator}
                      >
                        <CheckThinIcon className={styles.radioCheck} />
                      </Menu.RadioItemIndicator>
                      {label}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </div>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
    );
  }

  if (variant === "dropdown") {
    return (
      <Select
        label="Theme"
        options={THEME_OPTIONS}
        value={activeTheme}
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
    if (!mounted) {
      return (
        <div
          className={styles.iconSvg}
          style={{ width: "1em", height: "1em" }}
        />
      );
    }

    return themeUsesDarkAssets(resolvedTheme) ? (
      <Moon className={styles.iconSvg} />
    ) : (
      <Sun className={styles.iconSvg} />
    );
  };

  const containerClass =
    variant === "mobile" ? styles.mobileButton : styles.desktopButton;

  return (
    <button
      type="button"
      className={containerClass}
      onClick={handleThemeToggle}
      aria-label={`Switch theme (current: ${getLabel()})`}
      title={`Theme: ${getLabel()}`}
      suppressHydrationWarning
    >
      <span className={styles.icon} suppressHydrationWarning>
        {getIcon()}
      </span>
      {variant === "desktop" ? (
        <span className={styles.label} suppressHydrationWarning>
          {getLabel()}
        </span>
      ) : null}
    </button>
  );
};
