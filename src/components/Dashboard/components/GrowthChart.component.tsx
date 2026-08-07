"use client";

import classNames from "classnames";
import { useMemo, useState } from "react";
import { TanstackChart } from "src/components/shared/TanstackChart/TanstackChart.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import type { GrowthDataPoint } from "src/types/dashboard.types";
import { analyzeGrowthByYear } from "src/utils/growthTracker";
import { createCollectionGrowthAreaChartDefinition } from "src/utils/tanstackCharts";
import styles from "./GrowthChart.module.css";

interface GrowthChartProps {
  growthData: GrowthDataPoint[];
  hideHeading?: boolean;
}

const CHART_COLOR = "#5e5365";

export const GrowthChart = ({
  growthData,
  hideHeading = false,
}: GrowthChartProps) => {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const releases = useAllReleases();

  const chartData = useMemo(() => {
    if (viewMode === "yearly" && releases) {
      return analyzeGrowthByYear(releases);
    }

    return growthData;
  }, [viewMode, growthData, releases]);

  const definition = useMemo(() => {
    const formatDate = (date: string): string => {
      if (viewMode === "yearly") {
        return date;
      }

      const parts = date.split("-");
      const year = parts[0];
      const month = parts[1];

      if (!(year && month)) {
        return date;
      }

      const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1);

      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    };

    return createCollectionGrowthAreaChartDefinition(chartData, {
      color: CHART_COLOR,
      formatX: formatDate,
      tooltipValueLabel: "Cumulative Releases",
    });
  }, [chartData, viewMode]);

  return (
    <div className={styles.chartContainer}>
      <div
        className={classNames(styles.chartHeader, {
          [styles.chartHeaderCompact]: hideHeading,
        })}
      >
        {!hideHeading && <h2>Collection Growth</h2>}
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={classNames(styles.toggleButton, {
              [styles.active]: viewMode === "monthly",
            })}
            onClick={() => setViewMode("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={classNames(styles.toggleButton, {
              [styles.active]: viewMode === "yearly",
            })}
            onClick={() => setViewMode("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <TanstackChart
          ariaLabel="Collection growth over time"
          definition={definition}
          height={300}
        />
      </div>
    </div>
  );
};
