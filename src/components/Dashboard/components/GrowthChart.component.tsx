"use client";

import classNames from "classnames";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCollectionContext } from "src/context/collection.context";
import type { GrowthDataPoint } from "src/types/dashboard.types";
import { AXIS_STYLE, TOOLTIP_STYLE } from "src/utils/chartConfig";
import { analyzeGrowthByYear } from "src/utils/growthTracker";
import styles from "./GrowthChart.module.css";

interface GrowthChartProps {
  growthData: GrowthDataPoint[];
}

export function GrowthChart({ growthData }: GrowthChartProps) {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;

  const chartData = useMemo(() => {
    if (viewMode === "yearly" && releases) {
      return analyzeGrowthByYear(releases);
    }
    return growthData;
  }, [viewMode, growthData, releases]);

  const formatDate = (date: string): string => {
    if (viewMode === "yearly") {
      return date;
    }
    const parts = date.split("-");
    const year = parts[0];
    const month = parts[1];
    if (!(year && month)) return date;
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartHeader}>
        <h2>Collection Growth</h2>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={classNames(styles.toggleButton, {
              [styles.active as string]: viewMode === "monthly",
            })}
            onClick={() => setViewMode("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={classNames(styles.toggleButton, {
              [styles.active as string]: viewMode === "yearly",
            })}
            onClick={() => setViewMode("yearly")}
          >
            Yearly
          </button>
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5e5365" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#5e5365" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="var(--muted-foreground)"
              style={AXIS_STYLE}
            />
            <YAxis stroke="var(--muted-foreground)" style={AXIS_STYLE} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={(label: unknown) =>
                typeof label === "string" ? `Date: ${formatDate(label)}` : ""
              }
              formatter={(value: unknown) => {
                if (typeof value !== "number") return ["", ""];
                return [value.toLocaleString(), "Cumulative Releases"];
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#5e5365"
              fillOpacity={1}
              fill="url(#colorCumulative)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
