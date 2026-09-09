import { THEME_STORAGE_KEY } from "src/constants/storageKeys";
import { resolveThemeInitAttribute } from "src/utils/themeAppearance";

const hasDiscogsSession = (): boolean =>
  document.cookie
    .split(";")
    .some((cookie) => cookie.trim().startsWith("discogs_session=1"));

export const applyThemeFromStorage = (): void => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const resolvedTheme = resolveThemeInitAttribute({
      stored,
      prefersDark,
      hasSession: hasDiscogsSession(),
    });

    document.documentElement.setAttribute("data-theme", resolvedTheme);
  } catch {
    return;
  }
};
