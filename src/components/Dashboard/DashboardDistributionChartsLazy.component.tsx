"use client";

import type { ComponentProps } from "react";
import { ViewTransitionShell } from "src/components/ViewTransitionShell/ViewTransitionShell.component";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

const DistributionCharts = createClientLazyComponent(() =>
  import("src/components/Dashboard/DistributionCharts.component").then(
    (mod) => mod.DistributionCharts,
  ),
);

type DashboardDistributionChartsLazyProps = ComponentProps<
  typeof DistributionCharts
>;

export const DashboardDistributionChartsLazy = (
  props: DashboardDistributionChartsLazyProps,
) => {
  return (
    <ViewTransitionShell mode="deferredUpdate">
      <DistributionCharts {...props} />
    </ViewTransitionShell>
  );
};
