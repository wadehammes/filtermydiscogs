import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  cycleTheme,
  DARK_ASSET_THEMES,
  isStoredTheme,
  PALETTE_THEMES,
  resolvePaletteTheme,
  resolveThemeInitAttribute,
  STORED_THEMES,
  SYSTEM_DARK_PALETTE,
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

const readThemeInitSystemDarkPalette = (): string => {
  const themeInit = readFileSync(
    join(process.cwd(), "public/theme-init.js"),
    "utf8",
  );
  const match = themeInit.match(/const systemDarkPalette = "([^"]+)"/);

  if (!match?.[1]) {
    throw new Error(
      "Could not parse systemDarkPalette from public/theme-init.js",
    );
  }

  return match[1];
};

describe("themeAppearance", () => {
  it("cycles through every stored theme", () => {
    const start = cycleTheme("system");
    let current = start;
    const visited = new Set<string>();

    do {
      visited.add(current);
      current = cycleTheme(current);
    } while (current !== start);

    expect(visited.size).toBe(STORED_THEMES.length);
  });

  it("keeps theme-init.js palette list in sync with PALETTE_THEMES", () => {
    expect(new Set(readThemeInitPaletteThemes())).toEqual(
      new Set(PALETTE_THEMES),
    );
  });

  it("keeps theme-init.js system dark palette in sync with SYSTEM_DARK_PALETTE", () => {
    expect(readThemeInitSystemDarkPalette()).toBe(SYSTEM_DARK_PALETTE);
  });

  it("resolves system from OS preference", () => {
    expect(resolvePaletteTheme("system", false)).toBe("light");
    expect(resolvePaletteTheme("system", true)).toBe(SYSTEM_DARK_PALETTE);
    expect(SYSTEM_DARK_PALETTE).toBe("dark");
    expect(resolvePaletteTheme("sepia", true)).toBe("sepia");
    expect(resolvePaletteTheme("forest", false)).toBe("forest");
    expect(resolvePaletteTheme("wine", false)).toBe("wine");
    expect(resolvePaletteTheme("dark", true)).toBe("dark");
    expect(resolvePaletteTheme("codex", false)).toBe("codex");
  });

  it.each([
    {
      stored: null,
      prefersDark: false,
      hasSession: false,
      expected: "light",
    },
    {
      stored: null,
      prefersDark: true,
      hasSession: false,
      expected: SYSTEM_DARK_PALETTE,
    },
    {
      stored: "system",
      prefersDark: true,
      hasSession: true,
      expected: SYSTEM_DARK_PALETTE,
    },
    {
      stored: "system",
      prefersDark: false,
      hasSession: true,
      expected: "light",
    },
    {
      stored: "dark",
      prefersDark: true,
      hasSession: true,
      expected: "dark",
    },
    {
      stored: "sepia",
      prefersDark: true,
      hasSession: true,
      expected: "sepia",
    },
    {
      stored: "not-a-theme",
      prefersDark: false,
      hasSession: true,
      expected: "light",
    },
    {
      stored: "not-a-theme",
      prefersDark: true,
      hasSession: true,
      expected: SYSTEM_DARK_PALETTE,
    },
  ] as const)(
    "resolveThemeInitAttribute stored=$stored prefersDark=$prefersDark hasSession=$hasSession",
    ({ stored, prefersDark, hasSession, expected }) => {
      expect(
        resolveThemeInitAttribute({ stored, prefersDark, hasSession }),
      ).toBe(expected);
    },
  );

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
