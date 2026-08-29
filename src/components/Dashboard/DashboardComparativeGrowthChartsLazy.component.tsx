"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ComparativeGrowthCharts = dynamic(
  () =>
    import("src/components/Dashboard/ComparativeGrowthCharts.component").then(
      (mod) => mod.ComparativeGrowthCharts,
    ),
  { ssr: false },
);

type DashboardComparativeGrowthChartsLazyProps = ComponentProps<
  typeof ComparativeGrowthCharts
>;

export const DashboardComparativeGrowthChartsLazy = (
  props: DashboardComparativeGrowthChartsLazyProps,
) => <ComparativeGrowthCharts {...props} />;
