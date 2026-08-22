import type { StoredTheme } from "src/types/userPreferences.types";
import { isStoredTheme as isStoredThemeValue } from "src/utils/themeAppearance";

export const isValidStoredTheme = (value: unknown): value is StoredTheme =>
  typeof value === "string" && isStoredThemeValue(value);

export const parseStoredTheme = (
  value: unknown,
  fallback: StoredTheme = "system",
): StoredTheme => (isValidStoredTheme(value) ? value : fallback);
