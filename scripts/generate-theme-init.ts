import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  PALETTE_THEMES,
  SYSTEM_DARK_PALETTE,
} from "../src/utils/themeAppearance.ts";

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
  } catch (_e) {}
})();
`;

writeFileSync(join(process.cwd(), "public/theme-init.js"), themeInitSource);
