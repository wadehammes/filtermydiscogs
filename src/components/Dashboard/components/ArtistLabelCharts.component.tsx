"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import type { DistributionData } from "src/types/dashboard.types";
import { useChartColors } from "src/utils/chartColors";
import { AXIS_STYLE, CHART_MARGIN } from "src/utils/chartConfig";
import styles from "./ArtistLabelCharts.module.css";

interface ArtistLabelChartsProps {
  artistDistribution: DistributionData[];
  labelDistribution: DistributionData[];
}

interface BarProps {
  fill?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

const CustomBarBackground = (props: BarProps) => {
  const { x = 0, y = 0, width = 0, height = 0 } = props;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="transparent"
      fillOpacity={0}
      className={styles.barBackground}
    />
  );
};

const renderCustomBar = (props: unknown) => {
  const barProps = props as BarProps;
  const { fill, x = 0, y = 0, width = 0, height = 0 } = barProps;

  if (!(width && height)) {
    return null;
  }

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      style={{ cursor: "pointer" }}
      className={styles.customBar}
    />
  );
};

export function ArtistLabelCharts({
  artistDistribution,
  labelDistribution,
}: ArtistLabelChartsProps) {
  const colors = useChartColors();
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const yAxisWidth = isMobile ? 80 : 150;
  const chartMargin = isMobile
    ? { top: 5, right: 10, bottom: 5, left: 0 }
    : CHART_MARGIN;

  return (
    <div className={styles.chartsGrid}>
      <div className={styles.chartContainer}>
        <h2>Top Artists</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={artistDistribution as unknown as Record<string, unknown>[]}
              layout="vertical"
              margin={chartMargin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                style={AXIS_STYLE}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="var(--muted-foreground)"
                style={AXIS_STYLE}
                width={yAxisWidth}
              />
              <Bar
                dataKey="count"
                isAnimationActive={false}
                activeBar={false}
                shape={renderCustomBar as never}
                background={<CustomBarBackground />}
                label={{
                  position: "right" as const,
                  fill: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (value: unknown) => {
                    if (typeof value === "number") {
                      return value.toString();
                    }
                    return String(value ?? "");
                  },
                }}
              >
                {artistDistribution.map((_entry, index) => (
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
        <h2>Top Labels</h2>
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={labelDistribution as unknown as Record<string, unknown>[]}
              layout="vertical"
              margin={chartMargin}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                stroke="var(--muted-foreground)"
                style={AXIS_STYLE}
              />
              <YAxis
                type="category"
                dataKey="label"
                stroke="var(--muted-foreground)"
                style={AXIS_STYLE}
                width={yAxisWidth}
              />
              <Bar
                dataKey="count"
                isAnimationActive={false}
                activeBar={false}
                shape={renderCustomBar as never}
                background={<CustomBarBackground />}
                label={{
                  position: "right" as const,
                  fill: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                  formatter: (value: unknown) => {
                    if (typeof value === "number") {
                      return value.toString();
                    }
                    return String(value ?? "");
                  },
                }}
              >
                {labelDistribution.map((_entry, index) => (
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
