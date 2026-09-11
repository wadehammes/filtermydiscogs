"use client";

import type { ComponentProps } from "react";
import { ViewTransitionShell } from "src/components/ViewTransitionShell/ViewTransitionShell.component";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

const ComparativeGrowthCharts = createClientLazyComponent(() =>
  import("src/components/Dashboard/ComparativeGrowthCharts.component").then(
    (mod) => mod.ComparativeGrowthCharts,
  ),
);

type DashboardComparativeGrowthChartsLazyProps = ComponentProps<
  typeof ComparativeGrowthCharts
>;

export const DashboardComparativeGrowthChartsLazy = (
  props: DashboardComparativeGrowthChartsLazyProps,
) => {
  return (
    <ViewTransitionShell mode="deferredUpdate">
      <ComparativeGrowthCharts {...props} />
    </ViewTransitionShell>
  );
};
