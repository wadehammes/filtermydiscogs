import { useSyncExternalStore } from "react";

const COLLECTION_SIDE_PANEL_SELECTOR =
  '[data-collection-side-panel-open="true"]';

const subscribeCrateDrawerOpen = (onStoreChange: () => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-collection-side-panel-open"],
  });

  return () => observer.disconnect();
};

const getCrateDrawerOpen = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return Boolean(document.querySelector(COLLECTION_SIDE_PANEL_SELECTOR));
};

export const useCrateDrawerOpen = () => {
  return useSyncExternalStore(
    subscribeCrateDrawerOpen,
    getCrateDrawerOpen,
    () => false,
  );
};
