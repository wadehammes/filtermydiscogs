"use client";

import type { ComponentProps } from "react";
import { ViewTransitionShell } from "src/components/ViewTransitionShell/ViewTransitionShell.component";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

const GrowthChart = createClientLazyComponent(() =>
  import("src/components/Dashboard/GrowthChart.component").then(
    (mod) => mod.GrowthChart,
  ),
);

type DashboardGrowthChartLazyProps = ComponentProps<typeof GrowthChart>;

export const DashboardGrowthChartLazy = (
  props: DashboardGrowthChartLazyProps,
) => {
  return (
    <ViewTransitionShell mode="deferredUpdate">
      <GrowthChart {...props} />
    </ViewTransitionShell>
  );
};
