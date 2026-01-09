"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DistributionData } from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import { AXIS_STYLE, TOOLTIP_STYLE } from "src/utils/chartConfig";
import styles from "./DistributionCharts.module.css";

interface DistributionChartsProps {
  styleDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  formatDistribution: DistributionData[];
}

export function DistributionCharts({
  styleDistribution,
  decadeDistribution,
  formatDistribution,
}: DistributionChartsProps) {
  const colors = useChartColors();

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartContainer}>
        <h2>Top Styles</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={styleDistribution as unknown as Record<string, unknown>[]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                style={AXIS_STYLE}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="var(--muted-foreground)" style={AXIS_STYLE} />
              <Bar
                dataKey="count"
                label={{
                  position: "top",
                  fill: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (value: unknown) =>
                    typeof value === "number" ? value.toString() : "",
                }}
              >
                {styleDistribution.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>By Decade</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart margin={{ top: 20, right: 0, bottom: 60, left: 0 }}>
              <Pie
                data={
                  decadeDistribution as unknown as Record<string, unknown>[]
                }
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const { percent } = props;
                  if (!percent || percent < 0.02) return "";
                  const label = (props as { label?: string }).label || "";
                  return `${label} ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={100}
                fill="#5e5365"
                dataKey="count"
              >
                {decadeDistribution.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: unknown, _name: unknown, props: unknown) => {
                  if (
                    typeof value !== "number" ||
                    !props ||
                    typeof props !== "object"
                  ) {
                    return ["", ""];
                  }
                  const payload = props as { payload?: { label?: string } };
                  const total = decadeDistribution.reduce(
                    (sum, d) => sum + d.count,
                    0,
                  );
                  const percent = ((value / total) * 100).toFixed(1);
                  const label = payload.payload?.label || "";
                  return [`${value} (${percent}%)`, label];
                }}
              />
              <Legend
                formatter={(value, entry) => {
                  const total = decadeDistribution.reduce(
                    (sum, d) => sum + d.count,
                    0,
                  );
                  const payload = entry.payload as
                    | { count?: number; label?: string }
                    | undefined;
                  const count = payload?.count || 0;
                  const percent = ((count / total) * 100).toFixed(1);
                  const label = payload?.label || value;
                  return `${label} (${percent}%)`;
                }}
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <h2>By Format</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={formatDistribution as unknown as Record<string, unknown>[]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                style={AXIS_STYLE}
              />
              <YAxis stroke="var(--muted-foreground)" style={AXIS_STYLE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count">
                {formatDistribution.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
