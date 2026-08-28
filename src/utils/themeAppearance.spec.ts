import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  cycleTheme,
  DARK_ASSET_THEMES,
  isStoredTheme,
  PALETTE_THEMES,
  resolvePaletteTheme,
  STORED_THEMES,
  themeUsesDarkAssets,
} from "./themeAppearance";

const readThemeInitPaletteThemes = (): string[] => {
  const themeInit = readFileSync(
    join(process.cwd(), "public/theme-init.js"),
    "utf8",
  );
  const match = themeInit.match(/paletteThemes = new Set\(\[([\s\S]*?)\]\)/);

  if (!match?.[1]) {
    throw new Error("Could not parse paletteThemes from public/theme-init.js");
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].flatMap(([, theme]) =>
    theme ? [theme] : [],
  );
};

describe("themeAppearance", () => {
  it("cycles through every stored theme", () => {
    let current = cycleTheme("system");
    const visited = new Set<string>();

    do {
      visited.add(current);
      current = cycleTheme(current);
    } while (current !== "light");

    expect(visited.size).toBe(STORED_THEMES.length);
  });

  it("keeps theme-init.js palette list in sync with PALETTE_THEMES", () => {
    expect(new Set(readThemeInitPaletteThemes())).toEqual(
      new Set(PALETTE_THEMES),
    );
  });

  it("resolves system from OS preference", () => {
    expect(resolvePaletteTheme("system", false)).toBe("light");
    expect(resolvePaletteTheme("system", true)).toBe("dark");
    expect(resolvePaletteTheme("sepia", true)).toBe("sepia");
    expect(resolvePaletteTheme("forest", false)).toBe("forest");
    expect(resolvePaletteTheme("wine", false)).toBe("wine");
    expect(resolvePaletteTheme("codex", false)).toBe("codex");
  });

  it.each(
    PALETTE_THEMES.map((theme) => ({
      theme,
      usesDarkAssets: DARK_ASSET_THEMES.has(theme),
    })),
  )("uses dark marketing assets for $theme", ({ theme, usesDarkAssets }) => {
    expect(themeUsesDarkAssets(theme)).toBe(usesDarkAssets);
  });

  it.each(STORED_THEMES)("validates stored theme %s", (theme) => {
    expect(isStoredTheme(theme)).toBe(true);
  });
});
