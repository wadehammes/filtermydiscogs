"use client";

import { useMemo } from "react";
import { PieChartLegend } from "src/components/PieChartLegend/PieChartLegend.component";
import { TanstackChart } from "src/components/TanstackChart/TanstackChart.component";
import type { DistributionData } from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import {
  createDistributionPieChartDefinition,
  createVerticalBarChartDefinition,
  withBarColors,
} from "src/utils/tanstackCharts";
import styles from "./DistributionCharts.module.css";

interface DistributionChartsProps {
  styleDistribution: DistributionData[];
  genreDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  mediaTypeDistribution: DistributionData[];
  formatTagDistribution: DistributionData[];
}

export const DistributionCharts = ({
  styleDistribution,
  genreDistribution,
  decadeDistribution,
  mediaTypeDistribution,
  formatTagDistribution,
}: DistributionChartsProps) => {
  const colors = useChartColors();

  const styleBarData = useMemo(
    () => withBarColors(styleDistribution, colors),
    [styleDistribution, colors],
  );
  const formatBarData = useMemo(
    () => withBarColors(formatTagDistribution, colors),
    [formatTagDistribution, colors],
  );
  const styleBarDefinition = useMemo(
    () =>
      createVerticalBarChartDefinition({
        data: styleBarData,
        rotateXLabels: true,
      }),
    [styleBarData],
  );
  const formatBarDefinition = useMemo(
    () => createVerticalBarChartDefinition({ data: formatBarData }),
    [formatBarData],
  );
  const decadePieDefinition = useMemo(
    () =>
      createDistributionPieChartDefinition({
        data: decadeDistribution,
        colors,
      }),
    [decadeDistribution, colors],
  );
  const mediaTypePieDefinition = useMemo(
    () =>
      createDistributionPieChartDefinition({
        data: mediaTypeDistribution,
        colors,
      }),
    [mediaTypeDistribution, colors],
  );
  const genrePieDefinition = useMemo(
    () =>
      createDistributionPieChartDefinition({
        data: genreDistribution,
        colors,
      }),
    [genreDistribution, colors],
  );

  return (
    <div className={styles.distributionLayout}>
      <div className={styles.chartsGrid}>
        <div className={styles.chartContainer}>
          <h2>Top Styles</h2>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Top styles distribution"
              definition={styleBarDefinition}
            />
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h2>Physical Formats</h2>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Physical formats distribution"
              definition={formatBarDefinition}
            />
          </div>
        </div>
      </div>

      <div className={styles.chartsGridThree}>
        <div className={styles.chartContainer}>
          <h2>By Decade</h2>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Releases by decade"
              definition={decadePieDefinition}
              height={240}
            />
            <PieChartLegend colors={colors} data={decadeDistribution} />
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h2>Media Types</h2>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Media types distribution"
              definition={mediaTypePieDefinition}
              height={240}
            />
            <PieChartLegend colors={colors} data={mediaTypeDistribution} />
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h2>Top Genres</h2>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Top genres distribution"
              definition={genrePieDefinition}
              height={240}
            />
            <PieChartLegend colors={colors} data={genreDistribution} />
          </div>
        </div>
      </div>
    </div>
  );
};
