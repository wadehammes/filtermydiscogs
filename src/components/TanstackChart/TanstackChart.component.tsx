"use client";

import type { DomChartDefinition } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import {
  type ChartTooltipBodyRenderContext,
  RendererChart,
  type RendererChartProps,
} from "@tanstack/react-charts/tooltip";
import classNames from "classnames";
import { useCallback, useMemo } from "react";
import { useScrollRevealInView } from "src/hooks/useScrollRevealInView.hook";
import scrollRevealStyles from "src/styles/modules/scroll-reveal.module.css";
import { isGrowthTooltipContent } from "src/utils/tanstackCharts";
import styles from "./TanstackChart.module.css";

interface TanstackChartProps {
  definition: DomChartDefinition;
  ariaLabel: string;
  ariaDescription?: string;
  height?: number;
  className?: string;
  animateOnView?: boolean;
}

const chartRenderer = motion({
  initial: "always",
  respectReducedMotion: true,
  transition: { type: "tween", duration: 750, easing: "ease-out" },
});

export const TanstackChart = ({
  definition,
  ariaLabel,
  ariaDescription,
  height,
  className,
  animateOnView = true,
}: TanstackChartProps) => {
  const { ref, inView } = useScrollRevealInView({ skip: !animateOnView });

  const shouldRenderChart = !animateOnView || inView;

  const renderTooltipBody = useCallback(
    ({ content, defaultBody }: ChartTooltipBodyRenderContext) => {
      if (isGrowthTooltipContent(content)) {
        const metaLine = content.rows[0]?.value ?? "";

        return (
          <div className={styles.tooltipBody}>
            <p className={styles.tooltipTitle}>{content.title}</p>
            {metaLine ? <p className={styles.tooltipMeta}>{metaLine}</p> : null}
          </div>
        );
      }

      return defaultBody;
    },
    [],
  );

  const chartProps = useMemo(
    (): RendererChartProps => ({
      definition,
      ariaLabel,
      renderer: chartRenderer,
      className: classNames(styles.chart, className),
      renderTooltipBody,
      ...(height !== undefined ? { height } : {}),
      ...(ariaDescription ? { ariaDescription } : {}),
    }),
    [
      ariaDescription,
      ariaLabel,
      className,
      definition,
      height,
      renderTooltipBody,
    ],
  );

  return (
    <div
      ref={ref}
      className={classNames(
        scrollRevealStyles.root,
        inView && scrollRevealStyles.revealed,
        styles.viewport,
        height === undefined && styles.viewportFluid,
      )}
      style={height !== undefined ? { height } : undefined}
      aria-busy={animateOnView && !shouldRenderChart ? true : undefined}
    >
      {shouldRenderChart ? (
        <div className={scrollRevealStyles.enter}>
          <RendererChart {...chartProps} />
        </div>
      ) : animateOnView ? (
        <div className={scrollRevealStyles.placeholder} aria-hidden="true" />
      ) : null}
    </div>
  );
};
