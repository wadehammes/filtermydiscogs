"use client";

import type { DomChartDefinition } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { Chart, type ChartProps } from "@tanstack/react-charts/core";
import classNames from "classnames";
import { useMemo } from "react";
import styles from "./TanstackChart.module.css";

interface TanstackChartProps {
  definition: DomChartDefinition;
  ariaLabel: string;
  ariaDescription?: string;
  height?: number;
  className?: string;
}

const chartRenderer = motion({
  initial: true,
  transition: { type: "tween", duration: 500, easing: "ease-out" },
});

export const TanstackChart = ({
  definition,
  ariaLabel,
  ariaDescription,
  height,
  className,
}: TanstackChartProps) => {
  const chartProps = useMemo(
    (): ChartProps => ({
      definition,
      ariaLabel,
      renderer: chartRenderer,
      className: classNames(styles.chart, className),
      ...(height !== undefined ? { height } : {}),
      ...(ariaDescription ? { ariaDescription } : {}),
    }),
    [ariaDescription, ariaLabel, className, definition, height],
  );

  return <Chart {...chartProps} />;
};
