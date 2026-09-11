import type {
  PaletteTheme,
  StoredTheme,
} from "src/types/userPreferences.types";

export type { PaletteTheme, StoredTheme };

export const THEME_LABELS: Record<StoredTheme, string> = {
  amber: "Amber",
  codex: "Codex",
  dark: "Dark",
  dim: "Dim",
  discogs: "Discogs",
  forest: "Forest",
  futuristic: "Futuristic",
  "high-contrast": "High contrast",
  light: "Light",
  midnight: "Midnight",
  sepia: "Sepia",
  slate: "Slate",
  system: "System",
  wine: "Wine",
};

export const PALETTE_THEMES = [
  "amber",
  "codex",
  "dark",
  "dim",
  "discogs",
  "forest",
  "futuristic",
  "high-contrast",
  "light",
  "midnight",
  "sepia",
  "slate",
  "wine",
] as const satisfies readonly PaletteTheme[];

export const SYSTEM_DARK_PALETTE: PaletteTheme = "dark";

export const DARK_ASSET_THEMES = new Set<PaletteTheme>([
  "codex",
  "dark",
  "futuristic",
  "high-contrast",
  "midnight",
  "wine",
]);

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
