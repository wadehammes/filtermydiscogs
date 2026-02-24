(() => {
  try {
    const storageKey = "filtermydiscogs_theme";
    const stored = localStorage.getItem(storageKey);
    let resolvedTheme;

    if (stored === "light" || stored === "dark") {
      resolvedTheme = stored;
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      resolvedTheme = systemTheme;
      if (stored === "system") {
        localStorage.setItem(storageKey, systemTheme);
      }
    }

    document.documentElement.setAttribute("data-theme", resolvedTheme);
  } catch (_e) {}
})();
