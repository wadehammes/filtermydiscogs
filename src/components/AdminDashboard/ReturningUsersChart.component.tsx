"use client";

import { useMemo, useState } from "react";
import Select from "src/components/Select/Select.component";
import { TanstackChart } from "src/components/shared/TanstackChart/TanstackChart.component";
import type {
  AdminStatsDailyCountPoint,
  AdminStatsReturningUsersTimeSeries,
} from "src/types/dashboard.types";
import { THEME_PRIMARY_CHART_COLOR } from "src/utils/chartConfig";
import {
  createDailyCountAreaChartDefinition,
  formatChartDay,
} from "src/utils/tanstackCharts";
import styles from "./ReturningUsersChart.module.css";

type ReturningUsersWindow = "7" | "30" | "90";

const WINDOW_OPTIONS: Array<{ value: ReturningUsersWindow; label: string }> = [
  { value: "7", label: "7-day window" },
  { value: "30", label: "30-day window" },
  { value: "90", label: "90-day window" },
];

const WINDOW_DESCRIPTIONS: Record<ReturningUsersWindow, string> = {
  "7": "Signed up more than 7 days ago",
  "30": "Signed up more than 30 days ago",
  "90": "Signed up more than 90 days ago",
};

const SERIES_BY_WINDOW: Record<
  ReturningUsersWindow,
  keyof AdminStatsReturningUsersTimeSeries
> = {
  "7": "last7Days",
  "30": "last30Days",
  "90": "last90Days",
};

interface ReturningUsersChartProps {
  timeSeries: AdminStatsReturningUsersTimeSeries;
}

export const ReturningUsersChart = ({
  timeSeries,
}: ReturningUsersChartProps) => {
  const [window, setWindow] = useState<ReturningUsersWindow>("7");

  const chartData = useMemo((): AdminStatsDailyCountPoint[] => {
    const series = timeSeries[SERIES_BY_WINDOW[window]];
    const visibleDays = Number(window);

    return series.slice(-visibleDays);
  }, [timeSeries, window]);

  const definition = useMemo(
    () =>
      createDailyCountAreaChartDefinition(chartData, {
        color: THEME_PRIMARY_CHART_COLOR,
        formatX: formatChartDay,
        tooltipValueLabel: "returning users",
      }),
    [chartData],
  );

  const windowLabel =
    WINDOW_OPTIONS.find((option) => option.value === window)?.label ??
    "Returning users";

  return (
    <article className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartHeading}>
          <h3 className={styles.chartTitle}>Returning users over time</h3>
          <p className={styles.chartDescription}>
            Daily rolling count of users who {WINDOW_DESCRIPTIONS[window]} and
            logged in or synced preferences — not crate edits (see Active
            users).
          </p>
        </div>
        <Select
          className={styles.select}
          label="Rolling window"
          options={WINDOW_OPTIONS}
          showLabel={false}
          value={window}
          onChange={(value) => setWindow(String(value) as ReturningUsersWindow)}
        />
      </div>

      <div className={styles.chartWrapper}>
        <TanstackChart
          key={window}
          ariaLabel={`Returning users over time, ${windowLabel}`}
          definition={definition}
          height={260}
        />
      </div>
    </article>
  );
};
