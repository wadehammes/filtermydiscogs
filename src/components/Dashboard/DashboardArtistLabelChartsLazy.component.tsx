"use client";

import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

export const DashboardArtistLabelChartsLazy = createClientLazyComponent(() =>
  import("src/components/Dashboard/ArtistLabelCharts.component").then(
    (mod) => mod.ArtistLabelCharts,
  ),
);
