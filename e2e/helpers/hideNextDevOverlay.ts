import type { BrowserContext } from "@playwright/test";

const hideNextDevOverlaySource = `(() => {
  const removeOverlay = () => {
    for (const node of document.querySelectorAll(
      "script[data-nextjs-dev-overlay], nextjs-portal",
    )) {
      node.remove();
    }
  };

  const start = () => {
    const root = document.documentElement;

    if (!root || root.dataset.e2eOverlayBound === "1") {
      return;
    }

    root.dataset.e2eOverlayBound = "1";
    removeOverlay();
    new MutationObserver(removeOverlay).observe(root, {
      childList: true,
      subtree: true,
    });
  };

  const boot = new MutationObserver(() => {
    if (!document.documentElement) {
      return;
    }

    boot.disconnect();
    start();
  });

  boot.observe(document, { childList: true, subtree: true });
  start();
})();`;

export const installHideNextDevOverlay = async (context: BrowserContext) => {
  await context.addInitScript(hideNextDevOverlaySource);
};
