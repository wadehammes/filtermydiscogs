"use client";

import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import styles from "./ReleaseMiniPlayerMarquee.module.css";

interface ReleaseMiniPlayerMarqueeProps {
  children: React.ReactNode;
  className?: string;
}

export const ReleaseMiniPlayerMarquee = ({
  children,
  className,
}: ReleaseMiniPlayerMarqueeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;

    if (!(container && track)) {
      return;
    }

    const update = () => {
      setShouldAnimate(track.scrollWidth > container.clientWidth + 1);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(track);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={classNames(styles.marquee, className)}>
      <div
        ref={trackRef}
        className={classNames(styles.track, {
          [styles.trackAnimate]: shouldAnimate,
          [styles.trackIdle]: !shouldAnimate,
        })}
      >
        <span className={styles.segment}>{children}</span>
        {shouldAnimate ? (
          <span className={styles.segment} aria-hidden>
            {children}
          </span>
        ) : null}
      </div>
    </div>
  );
};
