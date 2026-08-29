"use client";

import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const DashboardDistributionChartsLazy = createClientLazyComponent(() =>
  import("src/components/Dashboard/DistributionCharts.component").then(
    (mod) => mod.DistributionCharts,
  ),
);
