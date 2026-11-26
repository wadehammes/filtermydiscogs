export const runDomViewTransition = (update: () => void): void => {
  if (typeof document === "undefined") {
    update();

    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();

    return;
  }

  if (!document.startViewTransition) {
    update();

    return;
  }

  document.startViewTransition(() => {
    update();
  });
};
