"use client";

import { type ReactNode, useMemo } from "react";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import Select from "src/components/Select/Select.component";
import { TanstackChart } from "src/components/TanstackChart/TanstackChart.component";
import type { DualSeriesPoint, TagOption } from "src/utils/tagGrowthTracker";
import {
  createDualSeriesAreaChartDefinition,
  formatMonthYear,
} from "src/utils/tanstackCharts";
import styles from "./ComparativeGrowthCharts.module.css";

export interface ComparisonChartCardProps {
  title: string;
  testId: string;
  primarySelectLabel: string;
  secondarySelectLabel: string;
  primaryOptions: TagOption[];
  secondaryOptions: TagOption[];
  resolvedPrimary: string;
  resolvedSecondary: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  primaryLegendLabel: string;
  secondaryLegendLabel: string;
  chartData: DualSeriesPoint[];
  primaryColor: string;
  secondaryColor: string;
  valueFormat: "count" | "percent";
  emptyMessage: string;
  ariaLabel: string;
  headerExtra?: ReactNode;
}

const toSelectOptions = (options: TagOption[]) =>
  options.map((option) => ({
    value: option.value,
    label: `${option.label} (${option.count})`,
  }));

export const ComparisonChartCard = ({
  title,
  testId,
  primarySelectLabel,
  secondarySelectLabel,
  primaryOptions,
  secondaryOptions,
  resolvedPrimary,
  resolvedSecondary,
  onPrimaryChange,
  onSecondaryChange,
  primaryLegendLabel,
  secondaryLegendLabel,
  chartData,
  primaryColor,
  secondaryColor,
  valueFormat,
  emptyMessage,
  ariaLabel,
  headerExtra,
}: ComparisonChartCardProps) => {
  const definition = useMemo(
    () =>
      createDualSeriesAreaChartDefinition(chartData, {
        primaryColor,
        secondaryColor,
        primaryLabel: primaryLegendLabel,
        secondaryLabel: secondaryLegendLabel,
        formatX: formatMonthYear,
        valueFormat,
      }),
    [
      chartData,
      primaryColor,
      primaryLegendLabel,
      secondaryColor,
      secondaryLegendLabel,
      valueFormat,
    ],
  );

  return (
    <article className={styles.chartContainer} data-testid={testId}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {headerExtra}
      </div>
      <div className={styles.controls}>
        {primaryOptions.length > 0 ? (
          <Select
            className={styles.select}
            label={primarySelectLabel}
            options={toSelectOptions(primaryOptions)}
            showLabel={true}
            value={resolvedPrimary}
            onChange={(value) => onPrimaryChange(String(value))}
          />
        ) : null}
        {secondaryOptions.length > 0 ? (
          <Select
            className={styles.select}
            label={secondarySelectLabel}
            options={toSelectOptions(secondaryOptions)}
            showLabel={true}
            value={resolvedSecondary}
            onChange={(value) => onSecondaryChange(String(value))}
          />
        ) : null}
      </div>

      {chartData.length > 0 ? (
        <>
          <ul aria-label="Chart legend" className={styles.legend}>
            <li className={styles.legendItem}>
              <span
                aria-hidden="true"
                className={styles.legendSwatch}
                style={{ backgroundColor: primaryColor }}
              />
              <span className={styles.legendLabel}>{primaryLegendLabel}</span>
            </li>
            <li className={styles.legendItem}>
              <span
                aria-hidden="true"
                className={styles.legendSwatch}
                style={{ backgroundColor: secondaryColor }}
              />
              <span className={styles.legendLabel}>{secondaryLegendLabel}</span>
            </li>
          </ul>
          <div className={styles.chartWrapper}>
            <TanstackChart
              ariaLabel={ariaLabel}
              definition={definition}
              height={260}
            />
          </div>
        </>
      ) : (
        <EmptyState
          variant="inline"
          title={emptyMessage}
          className={styles.emptyState}
        />
      )}
    </article>
  );
};
