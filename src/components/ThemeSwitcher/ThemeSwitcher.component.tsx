"use client";

import { useEffect, useState } from "react";
import { useTheme } from "src/hooks/useTheme.hook";
import Moon from "src/styles/icons/moon.svg";
import Sun from "src/styles/icons/sun.svg";
import styles from "./ThemeSwitcher.module.css";

interface ThemeSwitcherProps {
  variant?: "desktop" | "mobile";
}

export const ThemeSwitcher = ({ variant = "desktop" }: ThemeSwitcherProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const getIcon = () => {
    // Don't render icon until mounted to avoid hydration mismatch
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

  const getLabel = () => {
    // Use consistent default during SSR to avoid hydration mismatch
    if (!mounted) {
      return "Light";
    }
    return resolvedTheme === "dark" ? "Dark" : "Light";
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
      {variant === "desktop" && (
        <span className={styles.label} suppressHydrationWarning>
          {getLabel()}
        </span>
      )}
    </button>
  );
};
