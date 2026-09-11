(() => {
  try {
    const storageKey = "filtermydiscogs_theme";
    const stored = localStorage.getItem(storageKey);
    const paletteThemes = new Set([
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
    ]);
    const systemDarkPalette = "dark";
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
