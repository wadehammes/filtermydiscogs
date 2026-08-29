"use client";

import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const DashboardComparativeGrowthChartsLazy = createClientLazyComponent(
  () =>
    import("src/components/Dashboard/ComparativeGrowthCharts.component").then(
      (mod) => mod.ComparativeGrowthCharts,
    ),
);
