"use client";

import type { ReactNode } from "react";
import styles from "./StatsGrid.module.css";

interface StatsGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

export function StatsGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 4 },
  className,
}: StatsGridProps) {
  const mobileCols = columns.mobile || 1;
  const tabletCols = columns.tablet || 2;
  const desktopCols = columns.desktop || 4;

  return (
    <div
      className={`${styles.statsGrid} ${className || ""}`}
      style={
        {
          "--mobile-columns": mobileCols,
          "--tablet-columns": tabletCols,
          "--desktop-columns": desktopCols,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
