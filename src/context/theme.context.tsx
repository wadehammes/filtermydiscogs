"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
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

const getStoredTheme = (
  storageKey: string,
): "light" | "dark" | "system" | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    return null;
  }
  return null;
};

const applyThemeToDocument = (theme: "light" | "dark") => {
  if (typeof document === "undefined") return;

  const rootElement = document.documentElement;
  const currentTheme = rootElement.getAttribute("data-theme");

  if (currentTheme === theme) return;

  rootElement.setAttribute("data-theme", theme);

  if (currentTheme) {
    rootElement.classList.add("theme-transitioning");
    requestAnimationFrame(() => {
      rootElement.classList.remove("theme-transitioning");
    });
  }
};

const getInitialThemeFromDOM = (): "light" | "dark" | null => {
  if (typeof document === "undefined") return null;
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme === "light" || theme === "dark") {
    return theme;
  }
  return null;
};

const getInitialThemeSync = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";

  const dataTheme = document.documentElement.getAttribute("data-theme");
  if (dataTheme === "light" || dataTheme === "dark") {
    return dataTheme;
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (stored === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const systemTheme = prefersDark ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, systemTheme);
    return systemTheme;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
    defaultValue: false,
  });
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const systemThemeRef = useRef<"light" | "dark">(
    prefersDark ? "dark" : "light",
  );
  const [mounted, setMounted] = useState(false);

  const resolveTheme = useCallback(
    (stored: "light" | "dark" | "system" | null): "light" | "dark" => {
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      return systemThemeRef.current;
    },
    [],
  );

  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return getInitialThemeSync();
  });

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}

    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;

    const currentSystemTheme = prefersDark ? "dark" : "light";
    systemThemeRef.current = currentSystemTheme;

    const stored = getStoredTheme(THEME_STORAGE_KEY);
    if (stored === "system") {
      const resolved = resolveTheme(stored);
      if (resolved !== theme) {
        setThemeState(resolved);
        applyThemeToDocument(resolved);
      }
    }
  }, [prefersDark, mounted, theme, resolveTheme]);

  useLayoutEffect(() => {
    if (!mounted) return;

    const currentTheme = getInitialThemeFromDOM();
    if (currentTheme && currentTheme !== theme) {
      setThemeState(currentTheme);
    } else {
      applyThemeToDocument(theme);
    }
  }, [mounted, theme]);

  useLayoutEffect(() => {
    if (!mounted) return;

    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      const currentTheme = document.documentElement.getAttribute("data-theme");
      if (currentTheme !== theme) {
        applyThemeToDocument(theme);
      }
    }
  }, [pathname, theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
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
