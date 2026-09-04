import { useSyncExternalStore } from "react";

const CRATE_DRAWER_SELECTOR = '[data-crate-drawer-open="true"]';

const subscribeCrateDrawerOpen = (onStoreChange: () => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-crate-drawer-open"],
  });

  return () => observer.disconnect();
};

const getCrateDrawerOpen = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return Boolean(document.querySelector(CRATE_DRAWER_SELECTOR));
};

export const useCrateDrawerOpen = () => {
  return useSyncExternalStore(
    subscribeCrateDrawerOpen,
    getCrateDrawerOpen,
    () => false,
  );
};
