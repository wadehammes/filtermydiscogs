import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  VIEW_STATE_COOKIE_NAME,
  VIEW_STATE_STORAGE_KEY,
} from "../src/constants/storageKeys.ts";
import {
  PALETTE_THEMES,
  SYSTEM_DARK_PALETTE,
} from "../src/utils/themeAppearance.ts";

const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const paletteThemesLiteral = PALETTE_THEMES.map(
  (theme) => `      "${theme}",`,
).join("\n");

const themeInitSource = `(() => {
  try {
    const storageKey = "filtermydiscogs_theme";
    const stored = localStorage.getItem(storageKey);
    const paletteThemes = new Set([
${paletteThemesLiteral}
    ]);
    const systemDarkPalette = "${SYSTEM_DARK_PALETTE}";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const hasSession = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("discogs_session=1"));
    let resolvedTheme;

    if (!hasSession) {
      resolvedTheme = prefersDark ? systemDarkPalette : "light";
    } else if (stored && paletteThemes.has(stored)) {
      resolvedTheme = stored;
    } else if (stored === "system") {
      resolvedTheme = prefersDark ? systemDarkPalette : "light";
    } else {
      resolvedTheme = prefersDark ? systemDarkPalette : "light";
    }

    document.documentElement.setAttribute("data-theme", resolvedTheme);

    if (hasSession) {
      const viewStorageKey = "${VIEW_STATE_STORAGE_KEY}";
      const viewRaw = localStorage.getItem(viewStorageKey);
      if (viewRaw) {
        try {
          const parsed = JSON.parse(viewRaw);
          const currentView = parsed?.currentView;
          if (
            currentView === "card" ||
            currentView === "list" ||
            currentView === "random"
          ) {
            document.documentElement.setAttribute(
              "data-collection-view",
              currentView,
            );
            document.cookie = "${VIEW_STATE_COOKIE_NAME}=" + currentView + "; path=/; max-age=${VIEW_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax";
          }
        } catch (_viewError) {}
      }
    }
  } catch (_e) {}
})();
`;

writeFileSync(join(process.cwd(), "public/theme-init.js"), themeInitSource);
