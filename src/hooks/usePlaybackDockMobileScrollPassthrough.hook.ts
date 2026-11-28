"use client";

import { useEffect } from "react";
import { prepareCollectionScrollFromPlaybackDockTouch } from "src/utils/playbackDockFocus";

const VERTICAL_SCROLL_INTENT_PX = 8;

interface TouchStartPoint {
  clientX: number;
  clientY: number;
}

interface UsePlaybackDockMobileScrollPassthroughParams {
  dockShellNode: HTMLElement | null;
  enabled: boolean;
}

export const usePlaybackDockMobileScrollPassthrough = ({
  dockShellNode,
  enabled,
}: UsePlaybackDockMobileScrollPassthroughParams) => {
  useEffect(() => {
    if (!(enabled && dockShellNode)) {
      return undefined;
    }

    let touchStart: TouchStartPoint | null = null;

    const releasePageScroll = () => {
      prepareCollectionScrollFromPlaybackDockTouch();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        touchStart = null;
        return;
      }

      const touch = event.touches.item(0);

      if (!touch) {
        touchStart = null;
        return;
      }

      touchStart = { clientX: touch.clientX, clientY: touch.clientY };
      releasePageScroll();
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!touchStart || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches.item(0);

      if (!touch) {
        return;
      }

      const dx = touch.clientX - touchStart.clientX;
      const dy = touch.clientY - touchStart.clientY;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (ady >= VERTICAL_SCROLL_INTENT_PX && ady > adx) {
        releasePageScroll();
      }
    };

    const onTouchEnd = () => {
      touchStart = null;
    };

    const listenerOptions: AddEventListenerOptions = {
      capture: true,
      passive: true,
    };

    dockShellNode.addEventListener("touchstart", onTouchStart, listenerOptions);
    dockShellNode.addEventListener("touchmove", onTouchMove, listenerOptions);
    dockShellNode.addEventListener("touchend", onTouchEnd, listenerOptions);
    dockShellNode.addEventListener("touchcancel", onTouchEnd, listenerOptions);

    return () => {
      dockShellNode.removeEventListener("touchstart", onTouchStart, {
        capture: true,
      });
      dockShellNode.removeEventListener("touchmove", onTouchMove, {
        capture: true,
      });
      dockShellNode.removeEventListener("touchend", onTouchEnd, {
        capture: true,
      });
      dockShellNode.removeEventListener("touchcancel", onTouchEnd, {
        capture: true,
      });
    };
  }, [dockShellNode, enabled]);
};
