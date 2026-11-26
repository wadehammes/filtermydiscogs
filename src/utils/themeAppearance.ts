import type {
  PaletteTheme,
  StoredTheme,
} from "src/types/userPreferences.types";

export type { PaletteTheme, StoredTheme };

export const THEME_LABELS: Record<StoredTheme, string> = {
  amber: "Amber",
  aurora: "Aurora",
  codex: "Codex",
  dark: "Dark",
  dim: "Dim",
  discogs: "Discogs",
  ember: "Ember",
  forest: "Forest",
  futuristic: "Futuristic",
  "high-contrast": "High contrast",
  lavender: "Lavender",
  light: "Light",
  midnight: "Midnight",
  ocean: "Ocean",
  prism: "Prism",
  sepia: "Sepia",
  slate: "Slate",
  sunset: "Sunset",
  summer: "Summer",
  system: "System",
  terracotta: "Terracotta",
  wine: "Wine",
};

export const PALETTE_THEMES = [
  "amber",
  "aurora",
  "codex",
  "dark",
  "dim",
  "discogs",
  "ember",
  "forest",
  "futuristic",
  "high-contrast",
  "lavender",
  "light",
  "midnight",
  "ocean",
  "prism",
  "sepia",
  "slate",
  "sunset",
  "summer",
  "terracotta",
  "wine",
] as const satisfies readonly PaletteTheme[];

export const MULTI_HUE_PALETTE_THEMES = new Set<PaletteTheme>([
  "aurora",
  "discogs",
  "futuristic",
  "prism",
  "summer",
  "sunset",
]);

export const SYSTEM_DARK_PALETTE: PaletteTheme = "dark";

export const DARK_ASSET_THEMES = new Set<PaletteTheme>([
  "aurora",
  "codex",
  "dark",
  "ember",
  "futuristic",
  "high-contrast",
  "midnight",
  "summer",
  "wine",
]);

export const isMultiHuePaletteTheme = (theme: PaletteTheme): boolean =>
  MULTI_HUE_PALETTE_THEMES.has(theme);

export const STORED_THEMES: StoredTheme[] = [...PALETTE_THEMES, "system"];

export const isPaletteTheme = (value: string): value is PaletteTheme =>
  PALETTE_THEMES.includes(value as PaletteTheme);

export const isStoredTheme = (value: string): value is StoredTheme =>
  STORED_THEMES.includes(value as StoredTheme);

export const resolvePaletteTheme = (
  theme: StoredTheme,
  prefersDark: boolean,
): PaletteTheme => {
  if (theme === "system") {
    return prefersDark ? SYSTEM_DARK_PALETTE : "light";
  }

  return theme;
};

export const resolveThemeInitAttribute = ({
  stored,
  prefersDark,
  hasSession,
}: {
  stored: string | null;
  prefersDark: boolean;
  hasSession: boolean;
}): PaletteTheme => {
  if (!hasSession) {
    return prefersDark ? SYSTEM_DARK_PALETTE : "light";
  }

  if (stored && isPaletteTheme(stored)) {
    return stored;
  }

  return prefersDark ? SYSTEM_DARK_PALETTE : "light";
};

export const themeUsesDarkAssets = (theme: PaletteTheme): boolean =>
  DARK_ASSET_THEMES.has(theme);

export const cycleTheme = (current: StoredTheme): StoredTheme => {
  const index = STORED_THEMES.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % STORED_THEMES.length;
  return STORED_THEMES[nextIndex] ?? "light";
};
