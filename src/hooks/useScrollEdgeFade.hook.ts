"use client";

import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export interface ScrollEdgeFadeState {
  top: boolean;
  bottom: boolean;
}

interface UseScrollEdgeFadeOptions {
  enabled?: boolean;
  observe?: boolean;
}

export const useScrollEdgeFade = <T extends HTMLElement>({
  enabled = true,
  observe = true,
}: UseScrollEdgeFadeOptions = {}): {
  scrollRef: RefObject<T | null>;
  fade: ScrollEdgeFadeState;
  onScroll: () => void;
} => {
  const scrollRef = useRef<T>(null);
  const [fade, setFade] = useState<ScrollEdgeFadeState>({
    top: false,
    bottom: false,
  });

  const updateFade = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const hasOverflow = element.scrollHeight > element.clientHeight + 1;
    const atTop = element.scrollTop <= 1;
    const atBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 1;

    setFade({
      top: hasOverflow && !atTop,
      bottom: hasOverflow && !atBottom,
    });
  }, []);

  useLayoutEffect(() => {
    if (!enabled) {
      setFade({ top: false, bottom: false });
      return;
    }

    updateFade();

    if (!observe) {
      return;
    }

    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(updateFade);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [enabled, observe, updateFade]);

  return { scrollRef, fade, onScroll: updateFade };
};
