"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_STYLE, TOOLTIP_STYLE } from "src/utils/chartConfig";
import styles from "./GrowthAreaChart.module.css";

interface GrowthDataPoint {
  month: string;
  count: number;
}

interface GrowthAreaChartProps {
  title: string;
  data: GrowthDataPoint[];
  dataKey?: string;
  color?: string;
  gradientId?: string;
  height?: number;
  formatter?: (value: unknown) => [string, string];
  labelFormatter?: (label: unknown) => string;
}

export function GrowthAreaChart({
  title,
  data,
  dataKey = "count",
  color = "#5e5365",
  gradientId = "colorGradient",
  height = 250,
  formatter,
  labelFormatter,
}: GrowthAreaChartProps) {
  const formatDate = (date: string): string => {
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

  const defaultFormatter = (value: unknown) => {
    if (typeof value !== "number") return ["", ""];
    return [value.toLocaleString(), title];
  };

  const defaultLabelFormatter = (label: unknown) => {
    if (typeof label !== "string") return "";
    return `Month: ${formatDate(label)}`;
  };

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div className={styles.chartWrapper} style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="month"
              tickFormatter={formatDate}
              stroke="var(--muted-foreground)"
              style={AXIS_STYLE}
            />
            <YAxis stroke="var(--muted-foreground)" style={AXIS_STYLE} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={labelFormatter || defaultLabelFormatter}
              formatter={formatter || defaultFormatter}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
