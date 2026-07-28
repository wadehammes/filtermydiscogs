import type {
  PaletteTheme,
  StoredTheme,
} from "src/types/userPreferences.types";

export type { PaletteTheme, StoredTheme };

export const THEME_LABELS: Record<StoredTheme, string> = {
  light: "Light",
  dim: "Dim",
  sepia: "Sepia",
  slate: "Slate",
  dark: "Dark",
  midnight: "Midnight",
  futuristic: "Futuristic",
  "high-contrast": "High contrast",
  system: "System",
};

export const PALETTE_THEMES: PaletteTheme[] = [
  "light",
  "dim",
  "sepia",
  "slate",
  "dark",
  "midnight",
  "futuristic",
  "high-contrast",
];

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
    return prefersDark ? "dark" : "light";
  }

  return theme;
};

export const themeUsesDarkAssets = (theme: PaletteTheme): boolean =>
  theme === "dark" ||
  theme === "midnight" ||
  theme === "futuristic" ||
  theme === "high-contrast";

export const toSonnerTheme = (theme: PaletteTheme): "dark" | "light" =>
  themeUsesDarkAssets(theme) ? "dark" : "light";

export const cycleTheme = (current: StoredTheme): StoredTheme => {
  const index = STORED_THEMES.indexOf(current);
  const nextIndex = index === -1 ? 0 : (index + 1) % STORED_THEMES.length;
  return STORED_THEMES[nextIndex] ?? "light";
};
