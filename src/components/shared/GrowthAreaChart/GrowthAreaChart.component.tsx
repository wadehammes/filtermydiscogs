"use client";

import { useMemo } from "react";
import { TanstackChart } from "src/components/shared/TanstackChart/TanstackChart.component";
import type { AdminStatsDailyCountPoint } from "src/types/dashboard.types";
import { THEME_PRIMARY_CHART_COLOR } from "src/utils/chartConfig";
import {
  type AdminGrowthPoint,
  createAdminGrowthAreaChartDefinition,
  createDailyCountAreaChartDefinition,
  formatChartDay,
  formatMonthYear,
} from "src/utils/tanstackCharts";
import styles from "./GrowthAreaChart.module.css";

interface GrowthAreaChartProps {
  title: string;
  description?: string;
  data: AdminGrowthPoint[] | AdminStatsDailyCountPoint[];
  interval?: "month" | "day";
  color?: string;
  height?: number;
  formatter?: (value: unknown) => [string, string];
  labelFormatter?: (label: unknown) => string;
}

export const GrowthAreaChart = ({
  title,
  description,
  data,
  interval = "month",
  color = THEME_PRIMARY_CHART_COLOR,
  height = 250,
  formatter,
}: GrowthAreaChartProps) => {
  const tooltipValueLabel = formatter?.(0)?.[1] ?? title;

  const definition = useMemo(() => {
    if (interval === "day") {
      return createDailyCountAreaChartDefinition(
        data as AdminStatsDailyCountPoint[],
        {
          color,
          formatX: formatChartDay,
          tooltipValueLabel,
        },
      );
    }

    return createAdminGrowthAreaChartDefinition(data as AdminGrowthPoint[], {
      color,
      formatX: formatMonthYear,
      tooltipValueLabel,
    });
  }, [color, data, interval, tooltipValueLabel]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeading}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {description ? (
          <p className={styles.chartDescription}>{description}</p>
        ) : null}
      </div>
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
