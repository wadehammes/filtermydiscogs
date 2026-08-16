"use client";

import { useMemo } from "react";
import { TanstackChart } from "src/components/shared/TanstackChart/TanstackChart.component";
import { THEME_PRIMARY_CHART_COLOR } from "src/utils/chartConfig";
import {
  type AdminGrowthPoint,
  createAdminGrowthAreaChartDefinition,
  formatMonthYear,
} from "src/utils/tanstackCharts";
import styles from "./GrowthAreaChart.module.css";

interface GrowthAreaChartProps {
  title: string;
  data: AdminGrowthPoint[];
  color?: string;
  height?: number;
  formatter?: (value: unknown) => [string, string];
  labelFormatter?: (label: unknown) => string;
}

export const GrowthAreaChart = ({
  title,
  data,
  color = THEME_PRIMARY_CHART_COLOR,
  height = 250,
  formatter,
}: GrowthAreaChartProps) => {
  const definition = useMemo(
    () =>
      createAdminGrowthAreaChartDefinition(data, {
        color,
        formatX: formatMonthYear,
        tooltipValueLabel: formatter?.(0)?.[1] ?? title,
      }),
    [color, data, formatter, title],
  );

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartWrapper} style={{ height: `${height}px` }}>
        <TanstackChart
          ariaLabel={title}
          definition={definition}
          height={height}
        />
      </div>
    </div>
  );
};
