"use client";

import classNames from "classnames";
import { useMounted } from "src/hooks/useMounted.hook";
import { useTheme } from "src/hooks/useTheme.hook";
import Moon from "src/styles/icons/moon-thin.svg";
import Sun from "src/styles/icons/sun-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import styles from "./ThemeSwitcher.module.css";

interface ThemeSwitcherProps {
  variant?: "desktop" | "mobile" | "segmented";
}

export const ThemeSwitcher = ({ variant = "desktop" }: ThemeSwitcherProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const activeTheme = mounted ? resolvedTheme : "light";

  const getLabel = () => {
    if (!mounted) {
      return "Light";
    }

    return resolvedTheme === "dark" ? "Dark" : "Light";
  };

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
              setTheme("light");
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
              setTheme("dark");
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
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
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
