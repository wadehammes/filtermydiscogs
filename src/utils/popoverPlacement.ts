const TOUCH_TARGET_HEIGHT_PX = 48;
const POPOVER_GAP_PX = 4;
const MENU_PADDING_PX = 8;
const MAX_VISIBLE_MENU_HEIGHT_PX = 300;

export const getMaxVisibleMenuHeight = (): number => {
  if (typeof window === "undefined") {
    return MAX_VISIBLE_MENU_HEIGHT_PX;
  }

  return Math.min(window.innerHeight * 0.5, MAX_VISIBLE_MENU_HEIGHT_PX);
};

export const estimateSelectMenuHeight = (optionCount: number): number => {
  const contentHeight = optionCount * TOUCH_TARGET_HEIGHT_PX + MENU_PADDING_PX;
  return Math.min(contentHeight, getMaxVisibleMenuHeight());
};

export const estimateAutocompleteMenuHeight = (optionCount: number): number => {
  return Math.min(
    estimateSelectMenuHeight(optionCount) + 52,
    getMaxVisibleMenuHeight(),
  );
};

export const getBottomLimit = (trigger: HTMLElement): number => {
  let bottomLimit = window.innerHeight;

  const drawer = trigger.closest('[data-testid="fmdBottomDrawer"]');
  if (!drawer) {
    return bottomLimit;
  }

  const footer = drawer.querySelector("[data-bottom-drawer-footer]");
  if (footer instanceof HTMLElement) {
    bottomLimit = Math.min(bottomLimit, footer.getBoundingClientRect().top);
  }

  return bottomLimit;
};

export const shouldOpenPopoverUpward = ({
  trigger,
  estimatedMenuHeight,
}: {
  trigger: HTMLElement;
  estimatedMenuHeight: number;
}): boolean => {
  const rect = trigger.getBoundingClientRect();
  const bottomLimit = getBottomLimit(trigger);
  const spaceBelow = bottomLimit - rect.bottom - POPOVER_GAP_PX;
  const spaceAbove = rect.top - POPOVER_GAP_PX;
  const fitsBelow = spaceBelow >= estimatedMenuHeight;
  const fitsAbove = spaceAbove >= estimatedMenuHeight;

  if (fitsBelow) {
    return false;
  }

  if (fitsAbove) {
    return true;
  }

  return spaceAbove > spaceBelow;
};
