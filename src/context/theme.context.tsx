"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { THEME_STORAGE_KEY } from "src/constants/storageKeys";
import { useMounted } from "src/hooks/useMounted.hook";
import type {
  PaletteTheme,
  StoredTheme,
} from "src/types/userPreferences.types";
import {
  isPaletteTheme,
  isStoredTheme,
  resolvePaletteTheme,
} from "src/utils/themeAppearance";
import { useMediaQuery } from "usehooks-ts";

interface ThemeContextType {
  theme: StoredTheme;
  resolvedTheme: PaletteTheme;
  setTheme: (theme: StoredTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readStoredThemePreference = (storageKey: string): StoredTheme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && isStoredTheme(stored)) {
      return stored;
    }
  } catch {
    return null;
  }

  return null;
};

const applyThemeToDocument = (paletteTheme: PaletteTheme) => {
  if (typeof document === "undefined") {
    return;
  }

  const rootElement = document.documentElement;
  const currentTheme = rootElement.getAttribute("data-theme");

  if (currentTheme === paletteTheme) {
    return;
  }

  rootElement.setAttribute("data-theme", paletteTheme);

  if (currentTheme) {
    rootElement.classList.add("theme-transitioning");
    requestAnimationFrame(() => {
      rootElement.classList.remove("theme-transitioning");
    });
  }
};

const getInitialPaletteThemeFromDOM = (): PaletteTheme | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const theme = document.documentElement.getAttribute("data-theme");
  if (theme && isPaletteTheme(theme)) {
    return theme;
  }

  return null;
};

const getInitialThemePreference = (): StoredTheme => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = readStoredThemePreference(THEME_STORAGE_KEY);
  if (stored) {
    return stored;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)", {
    defaultValue: false,
  });
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const mounted = useMounted();

  const [theme, setThemeState] = useState<StoredTheme>(() =>
    getInitialThemePreference(),
  );

  const resolvedTheme = useMemo(
    () => resolvePaletteTheme(theme, prefersDark),
    [theme, prefersDark],
  );

  const setTheme = useCallback((newTheme: StoredTheme) => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}

    setThemeState(newTheme);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }

    const domTheme = getInitialPaletteThemeFromDOM();
    if (domTheme && domTheme !== resolvedTheme) {
      applyThemeToDocument(resolvedTheme);
      return;
    }

    applyThemeToDocument(resolvedTheme);
  }, [mounted, resolvedTheme]);

  useLayoutEffect(() => {
    if (!mounted) {
      return;
    }

    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      const currentTheme = document.documentElement.getAttribute("data-theme");
      if (currentTheme !== resolvedTheme) {
        applyThemeToDocument(resolvedTheme);
      }
    }
  }, [pathname, resolvedTheme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
