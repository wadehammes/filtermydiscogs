export const BOTTOM_DRAWER_DISMISS_EVENT = "fmd:bottom-drawer-dismiss";

export const dismissOpenBottomDrawers = (): void => {
  window.dispatchEvent(new CustomEvent(BOTTOM_DRAWER_DISMISS_EVENT));
};
