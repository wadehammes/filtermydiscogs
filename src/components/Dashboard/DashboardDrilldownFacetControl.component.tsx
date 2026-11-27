"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import type { ReactNode } from "react";
import tooltipStyles from "src/styles/modules/base-ui-tooltip.module.css";
import { buildDashboardDrilldownTooltip } from "src/utils/dashboardDrilldownCopy";

interface DashboardDrilldownFacetControlProps {
  children: ReactNode;
  className?: string;
  filterLabel: string;
  onPress: () => void;
}

export const DashboardDrilldownFacetControl = ({
  children,
  className,
  filterLabel,
  onPress,
}: DashboardDrilldownFacetControlProps) => {
  const tooltip = buildDashboardDrilldownTooltip(filterLabel);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        aria-label={tooltip}
        className={className}
        onClick={onPress}
        type="button"
      >
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner
          align="center"
          className={tooltipStyles.tooltippositioner}
          side="top"
        >
          <Tooltip.Popup className={tooltipStyles.tooltippopupwide}>
            {tooltip}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};
