"use client";

import type { ReactNode } from "react";

interface ReleaseCardOverlayActionSlotProps {
  isTable: boolean;
  isVertical: boolean;
  slotClass: string;
  tooltip?: string;
  children: ReactNode;
  tooltipClassName?: string;
}

export const ReleaseCardOverlayActionSlot = ({
  isTable,
  isVertical,
  slotClass,
  tooltip,
  children,
  tooltipClassName,
}: ReleaseCardOverlayActionSlotProps) => {
  if (isTable) {
    return children;
  }

  return (
    <div className={slotClass}>
      {children}
      {!isVertical && tooltip ? (
        <span className={tooltipClassName}>{tooltip}</span>
      ) : null}
    </div>
  );
};
