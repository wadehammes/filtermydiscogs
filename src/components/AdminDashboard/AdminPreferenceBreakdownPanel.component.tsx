"use client";

import { useMemo } from "react";
import { AdminMetricTable } from "src/components/AdminDashboard/AdminMetricTable.component";
import { PieChartLegend } from "src/components/PieChartLegend/PieChartLegend.component";
import { TanstackChart } from "src/components/TanstackChart/TanstackChart.component";
import { formatCommunityStatValue } from "src/lib/formatCommunityStatValue";
import type { AdminStatsPreferenceBreakdownRow } from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import {
  createDistributionPieChartDefinition,
  type PieDatum,
} from "src/utils/tanstackCharts";
import styles from "./AdminPreferenceBreakdownPanel.module.css";

interface AdminPreferenceBreakdownPanelProps {
  title: string;
  rows: AdminStatsPreferenceBreakdownRow[];
  totalUsers: number;
  labelForKey: (key: string) => string;
  emptyMessage?: string;
}

export function AdminPreferenceBreakdownPanel({
  title,
  rows,
  totalUsers,
  labelForKey,
  emptyMessage = "No data yet",
}: AdminPreferenceBreakdownPanelProps) {
  const colors = useChartColors();

  const { tableRows, pieData, pieDefinition, hasData } = useMemo(() => {
    const nextTableRows = rows.map((row) => ({
      key: row.key,
      label: labelForKey(row.key),
      count: row.count,
      share:
        totalUsers === 0
          ? "0%"
          : `${Math.round((row.count / totalUsers) * 100)}%`,
    }));
    const nextPieData: PieDatum[] = nextTableRows.map((row) => ({
      label: row.label,
      count: row.count,
    }));

    return {
      tableRows: nextTableRows,
      pieData: nextPieData,
      pieDefinition: createDistributionPieChartDefinition({
        data: nextPieData,
        colors,
      }),
      hasData: nextPieData.some((entry) => entry.count > 0),
    };
  }, [colors, labelForKey, rows, totalUsers]);

  return (
    <article className={styles.panel}>
      <p className={styles.eyebrow}>{title}</p>

      <div className={styles.content}>
        <div className={styles.chartSection}>
          {hasData ? (
            <>
              <TanstackChart
                ariaLabel={`${title} distribution`}
                definition={pieDefinition}
                height={200}
              />
              <PieChartLegend colors={colors} data={pieData} />
            </>
          ) : (
            <p className={styles.emptyChart}>{emptyMessage}</p>
          )}
        </div>

        <AdminMetricTable
          columns={[
            {
              key: "label",
              header: "Setting",
              align: "name",
            },
            {
              key: "count",
              header: "Users",
              align: "metric",
              render: (row) => formatCommunityStatValue(row.count),
            },
            {
              key: "share",
              header: "Share",
              align: "metric",
            },
          ]}
          emptyMessage={emptyMessage}
          getRowKey={(row) => row.key}
          rows={tableRows}
        />
      </div>
    </article>
  );
}
