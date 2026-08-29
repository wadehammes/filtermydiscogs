"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const ArtistLabelCharts = dynamic(
  () =>
    import("src/components/Dashboard/ArtistLabelCharts.component").then(
      (mod) => mod.ArtistLabelCharts,
    ),
  { ssr: false },
);

type DashboardArtistLabelChartsLazyProps = ComponentProps<
  typeof ArtistLabelCharts
>;

export const DashboardArtistLabelChartsLazy = (
  props: DashboardArtistLabelChartsLazyProps,
) => <ArtistLabelCharts {...props} />;
