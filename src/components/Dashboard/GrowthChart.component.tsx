"use client";

import classNames from "classnames";
import { useMemo, useState } from "react";
import { TanstackChart } from "src/components/TanstackChart/TanstackChart.component";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import segmentedStyles from "src/styles/modules/segmented-control.module.css";
import type { GrowthDataPoint } from "src/types/dashboard.types";
import { THEME_PRIMARY_CHART_COLOR } from "src/utils/chartConfig";
import { analyzeGrowthByYear } from "src/utils/growthTracker";
import { createCollectionGrowthAreaChartDefinition } from "src/utils/tanstackCharts";
import styles from "./GrowthChart.module.css";

interface GrowthChartProps {
  growthData: GrowthDataPoint[];
  hideHeading?: boolean;
}

const CHART_COLOR = THEME_PRIMARY_CHART_COLOR;

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
      xTickStrategy: viewMode === "yearly" ? "all" : "auto",
    });
  }, [chartData, viewMode]);

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        {hideHeading ? (
          <h3 className={styles.chartTitle}>Collection growth</h3>
        ) : (
          <h2 className={styles.chartTitle}>Collection growth</h2>
        )}
        <fieldset className={segmentedStyles.container}>
          <legend
            className={classNames(
              segmentedStyles.legend,
              accessibilityStyles.visuallyHidden,
            )}
          >
            Collection growth time range
          </legend>
          <button
            type="button"
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: viewMode === "monthly",
            })}
            onClick={() => setViewMode("monthly")}
            aria-pressed={viewMode === "monthly"}
          >
            Monthly
          </button>
          <button
            type="button"
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: viewMode === "yearly",
            })}
            onClick={() => setViewMode("yearly")}
            aria-pressed={viewMode === "yearly"}
          >
            Yearly
          </button>
        </fieldset>
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
