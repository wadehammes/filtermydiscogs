import {
  areaY,
  barX,
  barY,
  type ChartDefinition,
  type ChartPoint,
  defineChart,
  text,
} from "@tanstack/charts";
import { polar, radialArc } from "@tanstack/charts/polar";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleBand } from "@tanstack/charts-scales/band";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { scalePoint } from "@tanstack/charts-scales/point";
import { type PieArcDatum, pie } from "d3-shape";
import type {
  DistributionData,
  GrowthDataPoint,
} from "src/types/dashboard.types";
import { getChartColor } from "src/utils/chartColors";
import { CHART_TOOLTIP_CLASS } from "src/utils/chartConfig";

export interface AdminGrowthPoint {
  month: string;
  count: number;
}

interface BarDatum extends DistributionData {
  fill: string;
}

export interface PieDatum {
  label: string;
  count: number;
  percentage?: number;
}

const chartTooltip = {
  use: tooltip,
  className: CHART_TOOLTIP_CLASS,
  anchor: "point" as const,
  placement: "top" as const,
};

const chartMotion = {
  motion: {
    transition: {
      type: "tween" as const,
      duration: 500,
      easing: "ease-out" as const,
    },
  },
};

const barEnterMotion = {
  motion: (context: { phase: string; datumIndex: number }) => {
    if (context.phase === "enter") {
      return { delay: context.datumIndex * 35 };
    }

    return undefined;
  },
};

interface GrowthAreaChartOptions {
  color: string;
  formatX: (value: string) => string;
  tooltipValueLabel: string;
}

export const formatMonthYear = (date: string): string => {
  const parts = date.split("-");
  const year = parts[0];
  const month = parts[1];

  if (!(year && month)) {
    return date;
  }

  const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1);

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

export const withBarColors = (
  data: DistributionData[],
  colors: string[],
): BarDatum[] =>
  data.map((item, index) => ({
    ...item,
    fill: getChartColor(colors, index),
  }));

export const createCollectionGrowthAreaChartDefinition = (
  data: readonly GrowthDataPoint[],
  options: GrowthAreaChartOptions,
): ChartDefinition =>
  defineChart({
    ...chartMotion,
    marks: [
      areaY(data, {
        x: "date",
        y: "cumulative",
        fill: options.color,
        fillOpacity: 0.35,
        stroke: options.color,
        strokeWidth: 2,
      }),
    ],
    x: {
      scale: () => scalePoint<string>().padding(0.2),
      axis: {
        ticks: {
          format: (value: string | number) => options.formatX(String(value)),
        },
      },
    },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
    },
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<GrowthDataPoint>) {
        const xValue = String(point.xValue ?? "");
        const yValue =
          typeof point.yValue === "number"
            ? point.yValue.toLocaleString()
            : String(point.yValue ?? "");

        return `${options.formatX(xValue)}: ${yValue} ${options.tooltipValueLabel}`;
      },
    },
  });

export const createAdminGrowthAreaChartDefinition = (
  data: readonly AdminGrowthPoint[],
  options: GrowthAreaChartOptions,
): ChartDefinition =>
  defineChart({
    ...chartMotion,
    marks: [
      areaY(data, {
        x: "month",
        y: "count",
        fill: options.color,
        fillOpacity: 0.35,
        stroke: options.color,
        strokeWidth: 2,
      }),
    ],
    x: {
      scale: () => scalePoint<string>().padding(0.2),
      axis: {
        ticks: {
          format: (value: string | number) => options.formatX(String(value)),
        },
      },
    },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
    },
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<AdminGrowthPoint>) {
        const xValue = String(point.xValue ?? "");
        const yValue =
          typeof point.yValue === "number"
            ? point.yValue.toLocaleString()
            : String(point.yValue ?? "");

        return `${options.formatX(xValue)}: ${yValue} ${options.tooltipValueLabel}`;
      },
    },
  });

export const createVerticalBarChartDefinition = ({
  data,
  rotateXLabels = false,
}: {
  data: BarDatum[];
  rotateXLabels?: boolean;
}): ChartDefinition =>
  defineChart({
    ...chartMotion,
    marks: [
      barY(data, {
        x: "label",
        y: "count",
        fill: (datum) => datum.fill,
        radius: 2,
        key: "label",
        ...barEnterMotion,
      }),
      text(data, {
        x: "label",
        y: "count",
        text: (datum) => String(datum.count),
        dy: -6,
        anchor: "middle",
        fill: "currentColor",
        fontSize: 12,
        fontWeight: 600,
      }),
    ],
    x: {
      scale: () => scaleBand<string>().padding(0.25),
      ...(rotateXLabels ? { axis: { tickLabels: { rotate: -45 } } } : {}),
    },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
    },
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<BarDatum>) {
        const datum = point.datum;
        return `${datum.label}: ${datum.count.toLocaleString()}`;
      },
    },
  });

export const createHorizontalBarChartDefinition = ({
  data,
}: {
  data: BarDatum[];
}): ChartDefinition =>
  defineChart({
    ...chartMotion,
    marks: [
      barX(data, {
        x: "count",
        y: "label",
        fill: (datum) => datum.fill,
        radius: 2,
        key: "label",
        ...barEnterMotion,
        states: [
          {
            when: { focus: "primary" },
            style: { fillOpacity: 0.85 },
          },
        ],
      }),
      text(data, {
        x: "count",
        y: "label",
        text: (datum) => String(datum.count),
        dx: 6,
        anchor: "start",
        fill: "currentColor",
        fontSize: 12,
        fontWeight: 600,
      }),
    ],
    x: {
      scale: scaleLinear,
      nice: true,
      grid: true,
    },
    y: {
      scale: () => scaleBand<string>().padding(0.25),
    },
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<BarDatum>) {
        const datum = point.datum;
        return `${datum.label}: ${datum.count.toLocaleString()}`;
      },
    },
  });

const buildPieSlices = (data: PieDatum[]) => {
  const pieLayout = pie<PieDatum>()
    .sort(null)
    .value((datum) => datum.count);

  return pieLayout([...data]);
};

const createPiePolarMark = (
  slices: PieArcDatum<PieDatum>[],
  fill: (slice: PieArcDatum<PieDatum>) => string,
) =>
  polar({
    inset: 8,
    radiusRatio: 0.82,
    marks: [
      radialArc(slices, {
        startAngle: "startAngle",
        endAngle: "endAngle",
        padAngle: "padAngle",
        innerRadius: 0,
        cornerRadius: 2,
        fill,
        key: (slice) => slice.data.label,
      }),
    ],
  });

const createPieChartDefinition = ({
  data,
  colors,
  formatTooltip,
  fill,
}: {
  data: PieDatum[];
  colors: string[];
  formatTooltip: (datum: PieDatum, percent: string) => string;
  fill?: (slice: PieArcDatum<PieDatum>) => string;
}): ChartDefinition => {
  const slices = buildPieSlices(data);
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const resolveFill =
    fill ??
    ((slice) =>
      getChartColor(
        colors,
        data.findIndex((item) => item.label === slice.data.label),
      ));

  return defineChart({
    ...chartMotion,
    marks: [createPiePolarMark(slices, resolveFill)],
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<PieArcDatum<PieDatum>>) {
        const slice = point.datum;
        const count = slice.data.count;
        const percent = total > 0 ? ((count / total) * 100).toFixed(1) : "0";

        return formatTooltip(slice.data, percent);
      },
    },
  });
};

export const createDistributionPieChartDefinition = ({
  data,
  colors,
}: {
  data: PieDatum[];
  colors: string[];
}): ChartDefinition =>
  createPieChartDefinition({
    data,
    colors,
    formatTooltip: (datum, percent) =>
      `${datum.label}: ${datum.count} (${percent}%)`,
  });

export const getPieLegendPercent = (
  data: PieDatum[],
  item: PieDatum,
): string => {
  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  if (item.percentage != null) {
    return String(item.percentage);
  }

  return total > 0 ? ((item.count / total) * 100).toFixed(1) : "0";
};
