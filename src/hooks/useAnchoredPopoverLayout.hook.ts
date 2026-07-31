import {
  type CSSProperties,
  type RefObject,
  useId,
  useLayoutEffect,
} from "react";
import { getBottomLimit } from "src/utils/popoverPlacement";

const POPOVER_GAP_PX = 4;

const getScrollParents = (element: HTMLElement): HTMLElement[] => {
  const parents: HTMLElement[] = [];
  let parent = element.parentElement;

  while (parent) {
    const { overflow, overflowY } = getComputedStyle(parent);
    const scrollable =
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay" ||
      overflow === "auto" ||
      overflow === "scroll";

    if (scrollable && parent.scrollHeight > parent.clientHeight) {
      parents.push(parent);
    }

    parent = parent.parentElement;
  }

  return parents;
};

export interface UseAnchoredPopoverLayoutParams {
  isOpen: boolean;
  openUpward: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
}

export const useAnchoredPopoverLayout = ({
  isOpen,
  openUpward,
  anchorRef,
  panelRef,
}: UseAnchoredPopoverLayoutParams) => {
  const anchorName = `--popover-${useId().replace(/:/g, "")}`;
  const anchorStyle = {
    "--popover-anchor-name": anchorName,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePanelLayout = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;

      if (!(anchor && panel)) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const bottomLimit = getBottomLimit(anchor);
      const spaceBelow = bottomLimit - rect.bottom - POPOVER_GAP_PX;
      const spaceAbove = rect.top - POPOVER_GAP_PX;
      const availableSpace = openUpward ? spaceAbove : spaceBelow;
      const inFiltersBar = anchor.closest("[data-filters-bar]") !== null;

      if (inFiltersBar) {
        panel.style.setProperty("--popover-z-index", "var(--z-app-header)");
      } else {
        panel.style.removeProperty("--popover-z-index");
      }

      panel.style.setProperty(
        "--popover-max-height",
        `${Math.max(availableSpace, 0)}px`,
      );
      panel.style.setProperty("--popover-fallback-left", `${rect.left}px`);
      panel.style.setProperty("--popover-fallback-width", `${rect.width}px`);

      if (openUpward) {
        panel.style.setProperty("--popover-fallback-top", "auto");
        panel.style.setProperty(
          "--popover-fallback-bottom",
          `${window.innerHeight - rect.top + POPOVER_GAP_PX}px`,
        );
        return;
      }

      panel.style.setProperty(
        "--popover-fallback-top",
        `${rect.bottom + POPOVER_GAP_PX}px`,
      );
      panel.style.setProperty("--popover-fallback-bottom", "auto");
    };

    updatePanelLayout();

    const anchor = anchorRef.current;
    const scrollParents = anchor ? getScrollParents(anchor) : [];

    for (const scrollParent of scrollParents) {
      scrollParent.addEventListener("scroll", updatePanelLayout, {
        passive: true,
      });
    }

    window.addEventListener("scroll", updatePanelLayout, true);
    window.addEventListener("resize", updatePanelLayout);

    return () => {
      for (const scrollParent of scrollParents) {
        scrollParent.removeEventListener("scroll", updatePanelLayout);
      }

      window.removeEventListener("scroll", updatePanelLayout, true);
      window.removeEventListener("resize", updatePanelLayout);
    };
  }, [anchorRef, isOpen, openUpward, panelRef]);

  return { anchorStyle };
};
