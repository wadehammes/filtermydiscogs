import type { StoredTheme } from "src/types/userPreferences.types";

const VALID_THEMES = new Set<StoredTheme>(["light", "dark"]);

export const isValidStoredTheme = (value: unknown): value is StoredTheme =>
  typeof value === "string" && VALID_THEMES.has(value as StoredTheme);

export const parseStoredTheme = (
  value: unknown,
  fallback: StoredTheme = "light",
): StoredTheme => (isValidStoredTheme(value) ? value : fallback);
