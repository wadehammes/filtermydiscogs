"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: "light" | "dark";
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "filtermydiscogs_theme";

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredTheme = ({
  storageKey,
}: {
  storageKey: string;
}): "light" | "dark" | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(storageKey);
  // Convert "system" to current system preference if found (for migration)
  if (stored === "system") {
    const systemTheme = getSystemTheme();
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
  // Initialize with system preference if no stored theme exists
  const getInitialTheme = useCallback((): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    const stored = getStoredTheme({ storageKey: THEME_STORAGE_KEY });
    if (stored) return stored;
    // If no stored theme, use system preference
    return getSystemTheme();
  }, []);

  const [theme, setThemeState] = useState<"light" | "dark">(() =>
    getInitialTheme(),
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    getInitialTheme(),
  );

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
