import type { CSSProperties, RefObject } from "react";
import { useCallback, useState } from "react";

export const useFilterControlPositionerZIndex = (
  triggerRef: RefObject<HTMLElement | null>,
) => {
  const [positionerStyle, setPositionerStyle] = useState<CSSProperties>({});

  const updatePositionerZIndex = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const inBottomDrawer =
      trigger.closest('[data-testid="fmdBottomDrawer"]') !== null;
    const inFiltersBar = trigger.closest("[data-filters-bar]") !== null;

    if (inBottomDrawer) {
      setPositionerStyle({ zIndex: "calc(var(--z-5-modal) + 1)" });
      return;
    }

    const inModal = trigger.closest('[aria-modal="true"]') !== null;

    if (inModal) {
      setPositionerStyle({ zIndex: "calc(var(--z-5-modal) + 1)" });
      return;
    }

    if (inFiltersBar) {
      setPositionerStyle({ zIndex: "var(--z-app-header)" });
      return;
    }

    setPositionerStyle({});
  }, [triggerRef]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        updatePositionerZIndex();
      }
    },
    [updatePositionerZIndex],
  );

  return { positionerStyle, handleOpenChange };
};
