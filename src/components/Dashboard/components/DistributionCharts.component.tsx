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
import type {
  DistributionData,
  MediaFormatSubtypeGroup,
} from "src/types/dashboard.types";
import { getChartColor, useChartColors } from "src/utils/chartColors";
import { AXIS_STYLE, TOOLTIP_STYLE } from "src/utils/chartConfig";
import styles from "./DistributionCharts.module.css";

interface DistributionChartsProps {
  styleDistribution: DistributionData[];
  decadeDistribution: DistributionData[];
  mediaTypeDistribution: DistributionData[];
  formatTagDistribution: DistributionData[];
  mediaFormatSubtypeBreakdown?: MediaFormatSubtypeGroup[];
}

const formatPieTooltip = (
  distribution: DistributionData[],
  value: unknown,
  props: unknown,
): [string, string] => {
  if (typeof value !== "number" || !props || typeof props !== "object") {
    return ["", ""];
  }

  const payload = props as { payload?: { label?: string } };
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  const label = payload.payload?.label || "";

  return [`${value} (${percent}%)`, label];
};

const formatPieLegend = (
  distribution: DistributionData[],
  value: string,
  entry: { payload?: { count?: number; label?: string } },
): string => {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const count = entry.payload?.count || 0;
  const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
  const label = entry.payload?.label || value;

  return `${label} (${percent}%)`;
};

export function DistributionCharts({
  styleDistribution,
  decadeDistribution,
  mediaTypeDistribution,
  formatTagDistribution,
  mediaFormatSubtypeBreakdown = [],
}: DistributionChartsProps) {
  const colors = useChartColors();

  return (
    <div className={styles.distributionLayout}>
      <div className={styles.chartsGrid}>
        <div className={styles.chartContainer}>
          <h2>Top Styles</h2>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={styleDistribution as unknown as Record<string, unknown>[]}
                margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  style={AXIS_STYLE}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="var(--muted-foreground)" style={AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
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
                  {styleDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.label}`}
                      fill={getChartColor(colors, index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chartContainer}>
          <h2>Physical Formats</h2>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  formatTagDistribution as unknown as Record<string, unknown>[]
                }
                margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  style={AXIS_STYLE}
                />
                <YAxis stroke="var(--muted-foreground)" style={AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
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
                  {formatTagDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.label}`}
                      fill={getChartColor(colors, index)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
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
                  {decadeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.label}`}
                      fill={getChartColor(colors, index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, _name, props) =>
                    formatPieTooltip(decadeDistribution, value, props)
                  }
                />
                <Legend
                  formatter={(value, entry) =>
                    formatPieLegend(decadeDistribution, value, entry)
                  }
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
          <h2>Media Types</h2>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={340}>
              <PieChart margin={{ top: 20, right: 0, bottom: 60, left: 0 }}>
                <Pie
                  data={
                    mediaTypeDistribution as unknown as Record<
                      string,
                      unknown
                    >[]
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
                  {mediaTypeDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.label}`}
                      fill={getChartColor(colors, index)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, _name, props) =>
                    formatPieTooltip(mediaTypeDistribution, value, props)
                  }
                />
                <Legend
                  formatter={(value, entry) =>
                    formatPieLegend(mediaTypeDistribution, value, entry)
                  }
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
      </div>

      {mediaFormatSubtypeBreakdown.length > 0 && (
        <div className={styles.chartsGrid}>
          {mediaFormatSubtypeBreakdown.map((group) => (
            <div className={styles.chartContainer} key={group.mediaType}>
              <h2>{group.mediaType} Subtypes</h2>
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      group.subtypes as unknown as Record<string, unknown>[]
                    }
                    margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--muted-foreground)"
                      style={AXIS_STYLE}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      style={AXIS_STYLE}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
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
                      {group.subtypes.map((entry, index) => (
                        <Cell
                          key={`${group.mediaType}-${entry.label}`}
                          fill={getChartColor(colors, index)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
