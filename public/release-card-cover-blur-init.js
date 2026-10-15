(() => {
  try {
    const storageKey = "fmd:release-card-cover-blur-tier";
    const cached = sessionStorage.getItem(storageKey);
    if (cached === "always" || cached === "hover-only") {
      document.documentElement.setAttribute(
        "data-release-card-cover-blur",
        cached,
      );
    }
  } catch (_e) {}
})();
