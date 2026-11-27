"use client";

import classNames from "classnames";
import { useMemo } from "react";
import { DashboardBarDrilldownHint } from "src/components/Dashboard/DashboardBarDrilldownHint.component";
import { TanstackChart } from "src/components/TanstackChart/TanstackChart.component";
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import type { DistributionData } from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import type { DashboardDrilldownTarget } from "src/utils/dashboardDrilldownFilters";
import { definedProps } from "src/utils/definedProps";
import {
  createHorizontalBarChartDefinition,
  HORIZONTAL_BAR_ASSUMED_WIDTH,
  withBarColors,
} from "src/utils/tanstackCharts";
import styles from "./ArtistLabelCharts.module.css";

interface ArtistLabelChartsProps {
  artistDistribution: DistributionData[];
  labelDistribution: DistributionData[];
  onDrilldown?: (target: DashboardDrilldownTarget) => void;
}

export const ArtistLabelCharts = ({
  artistDistribution,
  labelDistribution,
  onDrilldown,
}: ArtistLabelChartsProps) => {
  const colors = useChartColors();
  const isMobile = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);

  const artistBarData = useMemo(
    () => withBarColors(artistDistribution, colors),
    [artistDistribution, colors],
  );
  const labelBarData = useMemo(
    () => withBarColors(labelDistribution, colors),
    [labelDistribution, colors],
  );
  const artistDefinition = useMemo(
    () =>
      createHorizontalBarChartDefinition({
        data: artistBarData,
        assumedWidth: isMobile
          ? HORIZONTAL_BAR_ASSUMED_WIDTH.compact
          : HORIZONTAL_BAR_ASSUMED_WIDTH.default,
      }),
    [artistBarData, isMobile],
  );
  const labelDefinition = useMemo(
    () =>
      createHorizontalBarChartDefinition({
        data: labelBarData,
        assumedWidth: isMobile
          ? HORIZONTAL_BAR_ASSUMED_WIDTH.compact
          : HORIZONTAL_BAR_ASSUMED_WIDTH.default,
      }),
    [labelBarData, isMobile],
  );

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartContainer}>
        <h2>Top Artists</h2>
        <div
          className={classNames({
            [styles.barChartWithHint]: onDrilldown !== undefined,
          })}
        >
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Top artists by release count"
              definition={artistDefinition}
              emphasizeCategoryAxisLabels
              height={400}
              {...definedProps({
                onBarLabelSelect: onDrilldown
                  ? (label: string) => onDrilldown({ kind: "search", label })
                  : undefined,
              })}
            />
          </div>
          {onDrilldown ? <DashboardBarDrilldownHint /> : null}
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>Top Labels</h2>
        <div
          className={classNames({
            [styles.barChartWithHint]: onDrilldown !== undefined,
          })}
        >
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel="Top labels by release count"
              definition={labelDefinition}
              emphasizeCategoryAxisLabels
              height={400}
              {...definedProps({
                onBarLabelSelect: onDrilldown
                  ? (label: string) => onDrilldown({ kind: "search", label })
                  : undefined,
              })}
            />
          </div>
          {onDrilldown ? <DashboardBarDrilldownHint /> : null}
        </div>
      </div>
    </div>
  );
};
