"use client";

import classNames from "classnames";
import Select from "src/components/Select/Select.component";
import { useMounted } from "src/hooks/useMounted.hook";
import { usePersistUserPreferences } from "src/hooks/usePersistUserPreferences.hook";
import { useTheme } from "src/hooks/useTheme.hook";
import Moon from "src/styles/icons/moon-thin.svg";
import Sun from "src/styles/icons/sun-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import type { StoredTheme } from "src/types/userPreferences.types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ThemeSwitcher.module.css";

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

interface ThemeSwitcherProps {
  variant?: "desktop" | "mobile" | "segmented" | "dropdown";
  className?: string;
}

export const ThemeSwitcher = ({
  variant = "desktop",
  className,
}: ThemeSwitcherProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const { persistPreferences } = usePersistUserPreferences();
  const mounted = useMounted();

  const activeTheme = mounted ? resolvedTheme : "light";

  const handleThemeChange = (nextTheme: StoredTheme) => {
    setTheme(nextTheme);
    persistPreferences({ theme: nextTheme });
  };

  const getLabel = () => {
    if (!mounted) {
      return "Light";
    }

    return resolvedTheme === "dark" ? "Dark" : "Light";
  };

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

  if (variant === "segmented") {
    return (
      <fieldset className={styles.segmentedGroup}>
        <legend className={styles.segmentedLegend}>Theme</legend>
        <div className={segmentedStyles.container}>
          <button
            type="button"
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: activeTheme === "light",
            })}
            onClick={() => {
              handleThemeChange("light");
            }}
            aria-pressed={activeTheme === "light"}
          >
            Light
          </button>
          <button
            type="button"
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: activeTheme === "dark",
            })}
            onClick={() => {
              handleThemeChange("dark");
            }}
            aria-pressed={activeTheme === "dark"}
          >
            Dark
          </button>
        </div>
      </fieldset>
    );
  }

  const handleThemeToggle = () => {
    handleThemeChange(resolvedTheme === "dark" ? "light" : "dark");
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

    return resolvedTheme === "dark" ? (
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
