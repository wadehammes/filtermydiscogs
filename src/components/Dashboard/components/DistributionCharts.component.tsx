"use client";

import { useMemo } from "react";
import { PieChartLegend } from "src/components/shared/PieChartLegend/PieChartLegend.component";
import { TanstackChart } from "src/components/shared/TanstackChart/TanstackChart.component";
import type {
  DistributionData,
  MediaFormatSubtypeGroup,
} from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import {
  createDistributionPieChartDefinition,
  createVerticalBarChartDefinition,
  withBarColors,
} from "src/utils/tanstackCharts";
import styles from "./DistributionCharts.module.css";

interface DistributionChartsProps {
  styleDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  mediaTypeDistribution: DistributionData[];
  formatTagDistribution: DistributionData[];
  mediaFormatSubtypeBreakdown?: MediaFormatSubtypeGroup[];
}

export const DistributionCharts = ({
  styleDistribution,
  decadeDistribution,
  mediaTypeDistribution,
  formatTagDistribution,
  mediaFormatSubtypeBreakdown = [],
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

      <div className={styles.chartsGrid}>
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
      </div>

      {mediaFormatSubtypeBreakdown.length > 0 && (
        <div className={styles.chartsGrid}>
          {mediaFormatSubtypeBreakdown.map((group) => {
            const subtypeBarData = withBarColors(group.subtypes, colors);
            const subtypeDefinition = createVerticalBarChartDefinition({
              data: subtypeBarData,
            });

            return (
              <div className={styles.chartContainer} key={group.mediaType}>
                <h2>{group.mediaType} Subtypes</h2>
                <div className={styles.chartWrapper}>
                  <TanstackChart
                    ariaLabel={`${group.mediaType} subtypes distribution`}
                    definition={subtypeDefinition}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
