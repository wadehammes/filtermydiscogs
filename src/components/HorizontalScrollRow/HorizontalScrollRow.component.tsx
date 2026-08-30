"use client";

import classNames from "classnames";
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { resolveHorizontalScrollWheel } from "src/utils/horizontalScrollRowWheel";
import styles from "./HorizontalScrollRow.module.css";

const supportsScrollTimeline =
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("animation-timeline", "scroll()");

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string | undefined;
  "data-testid"?: string;
}

export function HorizontalScrollRow({
  children,
  className,
  "data-testid": dataTestId,
}: HorizontalScrollRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atEnd, setAtEnd] = useState(true);

  const updateEndShadow = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const overflow = element.scrollWidth > element.clientWidth + 1;
    const end =
      element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;

    setCanScroll(overflow);
    setAtEnd(end);
  }, []);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    updateEndShadow();

    const resizeObserver = new ResizeObserver(updateEndShadow);
    resizeObserver.observe(element);

    const handleWheel = (event: WheelEvent) => {
      const wheelAction = resolveHorizontalScrollWheel({
        clientWidth: element.clientWidth,
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        shiftKey: event.shiftKey,
      });

      if (!wheelAction) {
        return;
      }

      element.scrollLeft = wheelAction.nextScrollLeft;
      event.preventDefault();
    };

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("wheel", handleWheel);
    };
  }, [updateEndShadow]);

  return (
    <div className={styles.wrapper} data-testid={dataTestId}>
      <div
        ref={scrollRef}
        className={classNames(styles.scroll, className, {
          [styles.scrollOverflow]: canScroll && supportsScrollTimeline,
          [styles.scrollFadeEnd]:
            canScroll && !supportsScrollTimeline && !atEnd,
        })}
        onScroll={updateEndShadow}
      >
        {children}
      </div>
    </div>
  );
}
