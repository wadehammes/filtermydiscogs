"use client";

import { useMemo } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useCollectionContext } from "src/context/collection.context";
import { useChartColors } from "src/utils/chartColors";
import { TOOLTIP_STYLE } from "src/utils/chartConfig";
import { calculateStyleEvolution } from "src/utils/styleEvolution";
import styles from "./StyleEvolution.module.css";

export function StyleEvolution() {
  const { state: collectionState } = useCollectionContext();
  const { releases } = collectionState;
  const colors = useChartColors();

  const styleEvolution = useMemo(() => {
    return calculateStyleEvolution(releases || []);
  }, [releases]);

  // Create a consistent color map for all styles across all periods
  const styleColorMap = useMemo(() => {
    const allStyles = new Set<string>();
    styleEvolution.forEach((period) => {
      period.styles.forEach((style) => {
        allStyles.add(style.name);
      });
    });

    const sortedStyles = Array.from(allStyles).sort();
    const colorMap = new Map<string, string>();

    sortedStyles.forEach((style, index) => {
      const color = colors[index % colors.length];
      if (color !== undefined) {
        colorMap.set(style, color);
      }
    });

    return colorMap;
  }, [styleEvolution, colors]);

  if (styleEvolution.length === 0) {
    return (
      <div className={styles.container}>
        <h2>Style Evolution</h2>
        <div className={styles.emptyState}>
          <p>Not enough data to show style evolution.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2>Style Evolution</h2>
      <p className={styles.subtitle}>
        Top genres by when you added releases to your collection
      </p>
      <div className={styles.evolutionList}>
        {styleEvolution.map((period, index) => (
          <div key={index} className={styles.periodItem}>
            <div className={styles.periodHeader}>
              <div className={styles.periodLabel}>{period.period}</div>
              <div className={styles.periodMeta}>
                <span className={styles.dateRange}>{period.dateRange}</span>
                <span className={styles.releaseCount}>
                  {period.releaseCount} releases
                </span>
              </div>
            </div>
            <div className={styles.chartWrapper}>
              {period.styles.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={period.styles.map((style) => ({
                        label: style.name,
                        value: style.count,
                        percentage: style.percentage,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#5e5365"
                      dataKey="value"
                    >
                      {period.styles.map((style) => (
                        <Cell
                          key={`cell-${style.name}`}
                          fill={styleColorMap.get(style.name) || colors[0]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(
                        value: unknown,
                        _name: unknown,
                        props: unknown,
                      ) => {
                        if (
                          typeof value !== "number" ||
                          !props ||
                          typeof props !== "object"
                        ) {
                          return ["", ""];
                        }
                        const payload = props as {
                          payload?: { label?: string; percentage?: number };
                        };
                        const label = payload.payload?.label || "";
                        const percentage = payload.payload?.percentage || 0;
                        return [`${value} (${percentage}%)`, label];
                      }}
                    />
                    <Legend
                      formatter={(_value, entry) => {
                        const payload = entry.payload as
                          | {
                              label?: string;
                              percentage?: number;
                              value?: number;
                            }
                          | undefined;
                        const label = payload?.label || "";
                        const percentage = payload?.percentage || 0;
                        return `${label} (${percentage}%)`;
                      }}
                      iconType="circle"
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noStyles}>No styles recorded</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
