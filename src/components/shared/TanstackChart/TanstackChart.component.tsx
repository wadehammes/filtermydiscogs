"use client";

import type { ChartDefinition } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import { Chart } from "@tanstack/react-charts/core";
import classNames from "classnames";
import { useMemo } from "react";
import styles from "./TanstackChart.module.css";

interface TanstackChartProps {
  definition: ChartDefinition;
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
    () => ({
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
