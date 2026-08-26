"use client";

import classNames from "classnames";
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styles from "./HorizontalScrollRow.module.css";

interface HorizontalScrollRowProps {
  children: ReactNode;
  className?: string | undefined;
}

export function HorizontalScrollRow({
  children,
  className,
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
      if (element.scrollWidth <= element.clientWidth + 1) {
        return;
      }

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (delta === 0) {
        return;
      }

      element.scrollLeft += delta;
      event.preventDefault();
    };

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      element.removeEventListener("wheel", handleWheel);
    };
  }, [updateEndShadow]);

  return (
    <div className={styles.wrapper}>
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
