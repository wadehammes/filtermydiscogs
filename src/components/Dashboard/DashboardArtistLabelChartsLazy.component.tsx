"use client";

import type { ComponentProps } from "react";
import { ViewTransitionShell } from "src/components/ViewTransitionShell/ViewTransitionShell.component";
import { createClientLazyComponent } from "src/utils/createClientLazyComponent";

const ArtistLabelCharts = createClientLazyComponent(() =>
  import("src/components/Dashboard/ArtistLabelCharts.component").then(
    (mod) => mod.ArtistLabelCharts,
  ),
);

type DashboardArtistLabelChartsLazyProps = ComponentProps<
  typeof ArtistLabelCharts
>;

export const DashboardArtistLabelChartsLazy = (
  props: DashboardArtistLabelChartsLazyProps,
) => {
  return (
    <ViewTransitionShell mode="deferredUpdate">
      <ArtistLabelCharts {...props} />
    </ViewTransitionShell>
  );
};
