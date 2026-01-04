"use client";

import { useEffect, useState } from "react";
import { useTheme } from "src/hooks/useTheme.hook";
import Moon from "src/styles/icons/moon.svg";
import Sun from "src/styles/icons/sun.svg";
import SystemTheme from "src/styles/icons/system-theme.svg";
import styles from "./ThemeSwitcher.module.css";

interface ThemeSwitcherProps {
  variant?: "desktop" | "mobile";
}

export const ThemeSwitcher = ({ variant = "desktop" }: ThemeSwitcherProps) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeToggle = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (!mounted) return <SystemTheme className={styles.iconSvg} />;
    if (theme === "system") {
      return <SystemTheme className={styles.iconSvg} />;
    }
    return resolvedTheme === "dark" ? (
      <Moon className={styles.iconSvg} />
    ) : (
      <Sun className={styles.iconSvg} />
    );
  };

  const getLabel = () => {
    if (!mounted) return "System";
    if (theme === "system") {
      return "System";
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
