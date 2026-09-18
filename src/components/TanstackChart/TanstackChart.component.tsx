"use client";

import type { DomChartDefinition } from "@tanstack/charts";
import { motion } from "@tanstack/charts/motion";
import {
  type ChartTooltipBodyRenderContext,
  RendererChart,
  type RendererChartProps,
} from "@tanstack/react-charts/tooltip";
import classNames from "classnames";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

interface ChartLayoutSize {
  width: number;
  height: number;
}

const SIZE_EPSILON = 2;

const chartRenderer = motion({
  initial: "always",
  respectReducedMotion: true,
  transition: { type: "tween", duration: 750, easing: "ease-out" },
});

const resolveLayoutHeight = (
  viewport: HTMLDivElement,
  heightProp: number | undefined,
): number => {
  if (heightProp !== undefined) {
    return heightProp;
  }

  return Math.round(viewport.clientHeight);
};

const layoutSizeStable = (
  previous: ChartLayoutSize,
  next: ChartLayoutSize,
): boolean =>
  Math.abs(previous.width - next.width) < SIZE_EPSILON &&
  Math.abs(previous.height - next.height) < SIZE_EPSILON;

export const TanstackChart = ({
  definition,
  ariaLabel,
  ariaDescription,
  height,
  className,
  animateOnView = true,
}: TanstackChartProps) => {
  const { ref: scrollRevealRef, inView } = useScrollRevealInView({
    skip: !animateOnView,
  });
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [layoutSize, setLayoutSize] = useState<ChartLayoutSize | null>(null);
  const [fontsReady, setFontsReady] = useState(() => !animateOnView);

  const shouldRenderChart = !animateOnView || inView;
  const usesFluidHeight = height === undefined;

  const mergeViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      viewportRef.current = node;
      scrollRevealRef(node);
    },
    [scrollRevealRef],
  );

  useEffect(() => {
    if (!animateOnView) {
      setFontsReady(true);
      return;
    }

    if (!shouldRenderChart) {
      setFontsReady(false);
      return;
    }

    let cancelled = false;
    setFontsReady(false);

    void document.fonts.ready.then(() => {
      if (!cancelled) {
        setFontsReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [animateOnView, shouldRenderChart]);

  useLayoutEffect(() => {
    if (!shouldRenderChart) {
      setLayoutSize(null);
      return;
    }

    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const measure = () => {
      const width = Math.round(viewport.clientWidth);
      const measuredHeight = resolveLayoutHeight(viewport, height);

      if (width <= 0 || measuredHeight <= 0) {
        return;
      }

      const next = { width, height: measuredHeight };

      setLayoutSize((previous) => {
        if (!previous) {
          return next;
        }

        if (layoutSizeStable(previous, next)) {
          return previous;
        }

        return next;
      });
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);

    return () => {
      resizeObserver.disconnect();
    };
  }, [height, shouldRenderChart]);

  const chartMountReady =
    shouldRenderChart && fontsReady && layoutSize !== null;
  const awaitingMount =
    shouldRenderChart && (!fontsReady || layoutSize === null);
  const showChartPlaceholder =
    (animateOnView && !shouldRenderChart) || awaitingMount;

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

  const chartProps = useMemo((): RendererChartProps | null => {
    if (!layoutSize) {
      return null;
    }

    return {
      definition,
      ariaLabel,
      renderer: chartRenderer,
      className: classNames(styles.chart, className),
      renderTooltipBody,
      width: layoutSize.width,
      height: layoutSize.height,
      initialWidth: layoutSize.width,
      ...(ariaDescription ? { ariaDescription } : {}),
    };
  }, [
    ariaDescription,
    ariaLabel,
    className,
    definition,
    layoutSize,
    renderTooltipBody,
  ]);

  return (
    <div
      ref={mergeViewportRef}
      className={classNames(
        scrollRevealStyles.root,
        inView && scrollRevealStyles.revealed,
        styles.viewport,
        usesFluidHeight && styles.viewportFluid,
      )}
      style={height !== undefined ? { height } : undefined}
      aria-busy={showChartPlaceholder ? true : undefined}
    >
      {chartMountReady && chartProps ? (
        <RendererChart {...chartProps} />
      ) : showChartPlaceholder ? (
        <div className={scrollRevealStyles.placeholder} aria-hidden="true" />
      ) : null}
    </div>
  );
};
