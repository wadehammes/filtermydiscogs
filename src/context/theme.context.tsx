"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useMediaQuery } from "usehooks-ts";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: "light" | "dark";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "filtermydiscogs_theme";

const getStoredTheme = ({
  storageKey,
  prefersDark,
}: {
  storageKey: string;
  prefersDark: boolean;
}): "light" | "dark" | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(storageKey);
  if (stored === "system") {
    const systemTheme = prefersDark ? "dark" : "light";
    localStorage.setItem(storageKey, systemTheme);
    return systemTheme;
  }
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return null;
};

const createThemeApplier = () => {
  let rootElement: HTMLElement | null = null;

  return ({ theme }: { theme: "light" | "dark" }) => {
    if (typeof document === "undefined") return;

    if (!rootElement) {
      rootElement = document.documentElement;
    }

    const currentTheme = rootElement.getAttribute("data-theme");
    if (currentTheme !== theme) {
      rootElement.classList.add("theme-transitioning");
      rootElement.setAttribute("data-theme", theme);

      requestAnimationFrame(() => {
        rootElement?.classList.remove("theme-transitioning");
      });
    } else {
      rootElement.setAttribute("data-theme", theme);
    }
  };
};

const applyTheme = createThemeApplier();

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
    defaultValue: false,
  });

  const getInitialTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    const stored = getStoredTheme({
      storageKey: THEME_STORAGE_KEY,
      prefersDark,
    });
    if (stored) return stored;
    return prefersDark ? "dark" : "light";
  }, [prefersDark]);

  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    if (typeof window !== "undefined") {
      applyTheme({ theme: newTheme });
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setResolvedTheme(newTheme);
    }
    setThemeState(newTheme);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    setResolvedTheme(initialTheme);
    applyTheme({ theme: initialTheme });
  }, [getInitialTheme]);

  useEffect(() => {
    setResolvedTheme(theme);
    applyTheme({ theme });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
