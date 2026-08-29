"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const DistributionCharts = dynamic(
  () =>
    import("src/components/Dashboard/DistributionCharts.component").then(
      (mod) => mod.DistributionCharts,
    ),
  { ssr: false },
);

type DashboardDistributionChartsLazyProps = ComponentProps<
  typeof DistributionCharts
>;

export const DashboardDistributionChartsLazy = (
  props: DashboardDistributionChartsLazyProps,
) => <DistributionCharts {...props} />;
