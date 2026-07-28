import { describe, expect, it } from "@jest/globals";
import {
  cycleTheme,
  isStoredTheme,
  resolvePaletteTheme,
  themeUsesDarkAssets,
} from "./themeAppearance";

describe("themeAppearance", () => {
  it("cycles through every stored theme", () => {
    let current = cycleTheme("system");
    const visited = new Set<string>();

    do {
      visited.add(current);
      current = cycleTheme(current);
    } while (current !== "light");

    expect(visited.size).toBe(9);
  });

  it("resolves system from OS preference", () => {
    expect(resolvePaletteTheme("system", false)).toBe("light");
    expect(resolvePaletteTheme("system", true)).toBe("dark");
    expect(resolvePaletteTheme("sepia", true)).toBe("sepia");
  });

  it("uses dark marketing assets for dark palettes only", () => {
    expect(themeUsesDarkAssets("light")).toBe(false);
    expect(themeUsesDarkAssets("dim")).toBe(false);
    expect(themeUsesDarkAssets("sepia")).toBe(false);
    expect(themeUsesDarkAssets("slate")).toBe(false);
    expect(themeUsesDarkAssets("dark")).toBe(true);
    expect(themeUsesDarkAssets("midnight")).toBe(true);
    expect(themeUsesDarkAssets("futuristic")).toBe(true);
    expect(themeUsesDarkAssets("high-contrast")).toBe(true);
  });

  it("validates stored themes", () => {
    expect(isStoredTheme("dim")).toBe(true);
    expect(isStoredTheme("high-contrast")).toBe(true);
    expect(isStoredTheme("system")).toBe(true);
    expect(isStoredTheme("sepia")).toBe(true);
    expect(isStoredTheme("futuristic")).toBe(true);
  });
});
