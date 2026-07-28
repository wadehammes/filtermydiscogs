(() => {
  try {
    const storageKey = "filtermydiscogs_theme";
    const stored = localStorage.getItem(storageKey);
    const paletteThemes = new Set([
      "light",
      "dim",
      "dark",
      "sepia",
      "slate",
      "midnight",
      "futuristic",
      "high-contrast",
    ]);
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    let resolvedTheme;

    if (stored && paletteThemes.has(stored)) {
      resolvedTheme = stored;
    } else if (stored === "system") {
      resolvedTheme = prefersDark ? "dark" : "light";
    } else {
      resolvedTheme = prefersDark ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", resolvedTheme);
  } catch (_e) {}
})();
