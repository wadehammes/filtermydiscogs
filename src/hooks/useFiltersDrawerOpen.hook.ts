import { useSyncExternalStore } from "react";

const FILTERS_DRAWER_SELECTOR = '[data-filters-drawer-open="true"]';

const subscribeFiltersDrawerOpen = (onStoreChange: () => void) => {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-filters-drawer-open"],
  });

  return () => observer.disconnect();
};

const getFiltersDrawerOpen = () => {
  if (typeof document === "undefined") {
    return false;
  }

  return Boolean(document.querySelector(FILTERS_DRAWER_SELECTOR));
};

export const useFiltersDrawerOpen = () => {
  return useSyncExternalStore(
    subscribeFiltersDrawerOpen,
    getFiltersDrawerOpen,
    () => false,
  );
};
