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
  const [showEndShadow, setShowEndShadow] = useState(false);

  const updateEndShadow = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }

    const canScroll = element.scrollWidth > element.clientWidth + 1;
    const atEnd =
      element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;

    setShowEndShadow(canScroll && !atEnd);
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
          [styles.scrollFadeEnd]: showEndShadow,
        })}
        onScroll={updateEndShadow}
      >
        {children}
      </div>
    </div>
  );
}
