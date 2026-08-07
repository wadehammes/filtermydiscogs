"use client";

import { useMemo } from "react";
import { TanstackChart } from "src/components/shared/TanstackChart/TanstackChart.component";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import type { DistributionData } from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import {
  createHorizontalBarChartDefinition,
  withBarColors,
} from "src/utils/tanstackCharts";
import styles from "./ArtistLabelCharts.module.css";

interface ArtistLabelChartsProps {
  artistDistribution: DistributionData[];
  labelDistribution: DistributionData[];
}

export const ArtistLabelCharts = ({
  artistDistribution,
  labelDistribution,
}: ArtistLabelChartsProps) => {
  const colors = useChartColors();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const artistBarData = useMemo(
    () => withBarColors(artistDistribution, colors),
    [artistDistribution, colors],
  );
  const labelBarData = useMemo(
    () => withBarColors(labelDistribution, colors),
    [labelDistribution, colors],
  );
  const artistDefinition = useMemo(
    () => createHorizontalBarChartDefinition({ data: artistBarData }),
    [artistBarData],
  );
  const labelDefinition = useMemo(
    () => createHorizontalBarChartDefinition({ data: labelBarData }),
    [labelBarData],
  );

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartContainer}>
        <h2>Top Artists</h2>
        <div
          className={styles.chartWrapper}
          data-compact-y-axis={isMobile ? "true" : undefined}
        >
          <TanstackChart
            ariaLabel="Top artists by release count"
            definition={artistDefinition}
            height={400}
          />
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>Top Labels</h2>
        <div
          className={styles.chartWrapper}
          data-compact-y-axis={isMobile ? "true" : undefined}
        >
          <TanstackChart
            ariaLabel="Top labels by release count"
            definition={labelDefinition}
            height={400}
          />
        </div>
      </div>
    </div>
  );
};
