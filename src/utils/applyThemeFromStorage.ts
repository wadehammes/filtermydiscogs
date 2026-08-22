import { THEME_STORAGE_KEY } from "src/constants/storageKeys";
import {
  isStoredTheme,
  resolvePaletteTheme,
  type StoredTheme,
} from "src/utils/themeAppearance";

const hasDiscogsSession = (): boolean =>
  document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith("discogs_session=1"));

const readThemePreference = (): StoredTheme => {
  if (!hasDiscogsSession()) {
    return "system";
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && isStoredTheme(stored)) {
      return stored;
    }
  } catch {
    return "system";
  }

  return "system";
};

export const applyThemeFromStorage = (): void => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  try {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const preference = readThemePreference();
    const resolvedTheme = resolvePaletteTheme(preference, prefersDark);

    document.documentElement.setAttribute("data-theme", resolvedTheme);
  } catch {
    return;
  }
};
