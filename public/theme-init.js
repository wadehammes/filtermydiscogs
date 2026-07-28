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
    const hasSession = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith("discogs_session=1"));
    let resolvedTheme;

    if (!hasSession) {
      resolvedTheme = prefersDark ? "dark" : "light";
    } else if (stored && paletteThemes.has(stored)) {
      resolvedTheme = stored;
    } else if (stored === "system") {
      resolvedTheme = prefersDark ? "dark" : "light";
    } else {
      resolvedTheme = prefersDark ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", resolvedTheme);
  } catch (_e) {}
})();
