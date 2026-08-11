import {
  areaY,
  barX,
  barY,
  type ChartAxisPresentationOptions,
  type ChartPoint,
  type DomChartDefinition,
  d3Curve,
  defineChart,
} from "@tanstack/charts";
import { polar, radialArc } from "@tanstack/charts/polar";
import { tooltip } from "@tanstack/charts/tooltip";
import { scaleBand } from "@tanstack/charts-scales/band";
import { scaleLinear } from "@tanstack/charts-scales/linear";
import { scalePoint } from "@tanstack/charts-scales/point";
import { curveMonotoneX, type PieArcDatum, pie } from "d3-shape";
import type {
  DistributionData,
  GrowthDataPoint,
} from "src/types/dashboard.types";
import { getChartColor } from "src/utils/chartColors";
import { CHART_TOOLTIP_CLASS } from "src/utils/chartConfig";
import type { DualSeriesPoint } from "src/utils/tagGrowthTracker";

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

const smoothAreaCurve = d3Curve(curveMonotoneX);

const TIME_SERIES_TICK_SPACING_PX = 80;
const TIME_SERIES_TICK_MIN = 3;
const TIME_SERIES_TICK_MAX = 8;

const modernAxisPresentation = {
  line: false,
  ticks: { size: 0, padding: 8 },
} satisfies ChartAxisPresentationOptions;

const resolveTimeSeriesTickCount = (width: number): number =>
  Math.max(
    TIME_SERIES_TICK_MIN,
    Math.min(
      TIME_SERIES_TICK_MAX,
      Math.floor(width / TIME_SERIES_TICK_SPACING_PX),
    ),
  );

const pickEvenlySpacedTickValues = <T extends string>(
  values: readonly T[],
  maxTicks: number,
): T[] => {
  if (values.length === 0) {
    return [];
  }

  if (values.length <= maxTicks) {
    return [...values];
  }

  const picks: T[] = [];
  const lastIndex = values.length - 1;

  for (let index = 0; index < maxTicks; index += 1) {
    const valueIndex = Math.round((index * lastIndex) / (maxTicks - 1));
    const value = values[valueIndex];

    if (value !== undefined && picks.at(-1) !== value) {
      picks.push(value);
    }
  }

  return picks;
};

const modernValueAxis = {
  scale: scaleLinear,
  nice: true,
  grid: true,
  axis: modernAxisPresentation,
};

interface GrowthAreaChartOptions {
  color: string;
  formatX: (value: string) => string;
  tooltipValueLabel?: string;
  xTickStrategy?: "auto" | "all";
}

interface DualSeriesAreaChartOptions {
  primaryColor: string;
  secondaryColor: string;
  primaryLabel: string;
  secondaryLabel: string;
  formatX: (value: string) => string;
  valueFormat: "count" | "percent";
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

const resolveGrowthTotal = (
  point: ChartPoint<GrowthDataPoint>,
): number | null => {
  if (typeof point.datum?.cumulative === "number") {
    return point.datum.cumulative;
  }

  if (typeof point.yValue === "number") {
    return point.yValue;
  }

  return null;
};

const formatGrowthTooltipContent = (
  point: ChartPoint<GrowthDataPoint>,
  formatX: (value: string) => string,
) => {
  const periodLabel = formatX(String(point.datum?.date ?? point.xValue ?? ""));
  const total = resolveGrowthTotal(point);

  if (total == null) {
    return { title: periodLabel, rows: [] };
  }

  return {
    title: periodLabel,
    rows: [{ label: "", value: `${total.toLocaleString()} total records` }],
  };
};

export const isGrowthTooltipContent = (
  content: unknown,
): content is {
  title: string;
  rows: Array<{ label: string; value: string }>;
} => {
  if (
    typeof content !== "object" ||
    content === null ||
    !("title" in content)
  ) {
    return false;
  }

  const rows = (content as { rows?: unknown }).rows;

  return (
    Array.isArray(rows) &&
    rows.length === 1 &&
    typeof rows[0]?.value === "string" &&
    rows[0].value.includes("total records") &&
    rows[0].label === ""
  );
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
): DomChartDefinition =>
  defineChart({
    chart: ({ width }) => {
      const dates = data.map((point) => point.date);
      const tickValues =
        options.xTickStrategy === "all"
          ? [...dates]
          : pickEvenlySpacedTickValues(
              dates,
              resolveTimeSeriesTickCount(width),
            );

      return {
        ...chartMotion,
        marks: [
          areaY(data, {
            x: "date",
            y: "cumulative",
            fill: options.color,
            fillOpacity: 0.16,
            stroke: options.color,
            strokeWidth: 2.5,
            curve: smoothAreaCurve,
          }),
        ],
        x: {
          scale: () => scalePoint<string>().padding(0.35),
          axis: {
            ...modernAxisPresentation,
            ...(options.xTickStrategy === "all" && tickValues.length > 10
              ? { tickLabels: { thin: true } }
              : {}),
            ticks: {
              ...modernAxisPresentation.ticks,
              values: tickValues,
              format: (value: string | number) =>
                options.formatX(String(value)),
            },
          },
        },
        y: modernValueAxis,
      };
    },
    tooltip: {
      ...chartTooltip,
      content(points) {
        const point = points[0] as ChartPoint<GrowthDataPoint> | undefined;

        if (!point) {
          return { rows: [] };
        }

        return formatGrowthTooltipContent(point, options.formatX);
      },
    },
  }) as DomChartDefinition;

const formatSeriesValue = (
  value: number,
  valueFormat: DualSeriesAreaChartOptions["valueFormat"],
): string => (valueFormat === "percent" ? `${value}%` : value.toLocaleString());

const shareValueAxis = {
  scale: scaleLinear,
  nice: true,
  grid: true,
  axis: {
    ...modernAxisPresentation,
    ticks: {
      ...modernAxisPresentation.ticks,
      format: (value: number) => `${value}%`,
    },
  },
};

export const createDualSeriesAreaChartDefinition = (
  data: readonly DualSeriesPoint[],
  options: DualSeriesAreaChartOptions,
): DomChartDefinition =>
  defineChart({
    chart: ({ width }) => {
      const tickValues = pickEvenlySpacedTickValues(
        data.map((point) => point.date),
        resolveTimeSeriesTickCount(width),
      );

      return {
        ...chartMotion,
        marks: [
          areaY(data, {
            x: "date",
            y: "primaryValue",
            fill: options.primaryColor,
            fillOpacity: 0.12,
            stroke: options.primaryColor,
            strokeWidth: 2.5,
            curve: smoothAreaCurve,
          }),
          areaY(data, {
            x: "date",
            y: "secondaryValue",
            fill: options.secondaryColor,
            fillOpacity: 0.12,
            stroke: options.secondaryColor,
            strokeWidth: 2.5,
            curve: smoothAreaCurve,
          }),
        ],
        x: {
          scale: () => scalePoint<string>().padding(0.35),
          axis: {
            ...modernAxisPresentation,
            ticks: {
              ...modernAxisPresentation.ticks,
              values: tickValues,
              format: (value: string | number) =>
                options.formatX(String(value)),
            },
          },
        },
        y: options.valueFormat === "percent" ? shareValueAxis : modernValueAxis,
      };
    },
    tooltip: {
      ...chartTooltip,
      formatGroup(points) {
        const datum = (points[0] as ChartPoint<DualSeriesPoint> | undefined)
          ?.datum;

        if (!datum) {
          return "";
        }

        const periodLabel = options.formatX(String(datum.date));
        const primaryValue = formatSeriesValue(
          datum.primaryValue,
          options.valueFormat,
        );
        const secondaryValue = formatSeriesValue(
          datum.secondaryValue,
          options.valueFormat,
        );
        const suffix =
          options.valueFormat === "percent" ? " of adds" : " total records";

        return `${periodLabel}\n${options.primaryLabel}: ${primaryValue}${suffix}\n${options.secondaryLabel}: ${secondaryValue}${suffix}`;
      },
    },
  }) as DomChartDefinition;

export const createAdminGrowthAreaChartDefinition = (
  data: readonly AdminGrowthPoint[],
  options: GrowthAreaChartOptions,
): DomChartDefinition =>
  defineChart({
    chart: ({ width }) => {
      const tickValues = pickEvenlySpacedTickValues(
        data.map((point) => point.month),
        resolveTimeSeriesTickCount(width),
      );

      return {
        ...chartMotion,
        marks: [
          areaY(data, {
            x: "month",
            y: "count",
            fill: options.color,
            fillOpacity: 0.16,
            stroke: options.color,
            strokeWidth: 2.5,
            curve: smoothAreaCurve,
          }),
        ],
        x: {
          scale: () => scalePoint<string>().padding(0.35),
          axis: {
            ...modernAxisPresentation,
            ticks: {
              ...modernAxisPresentation.ticks,
              values: tickValues,
              format: (value: string | number) =>
                options.formatX(String(value)),
            },
          },
        },
        y: modernValueAxis,
      };
    },
    tooltip: {
      ...chartTooltip,
      format(point) {
        const typedPoint = point as ChartPoint<AdminGrowthPoint>;
        const xValue = String(typedPoint.xValue ?? "");
        const yValue =
          typeof typedPoint.yValue === "number"
            ? typedPoint.yValue.toLocaleString()
            : String(typedPoint.yValue ?? "");

        return `${options.formatX(xValue)}: ${yValue} ${options.tooltipValueLabel ?? "records"}`;
      },
    },
  }) as DomChartDefinition;

export const createVerticalBarChartDefinition = ({
  data,
  rotateXLabels = false,
}: {
  data: BarDatum[];
  rotateXLabels?: boolean;
}): DomChartDefinition =>
  defineChart({
    ...chartMotion,
    marks: [
      barY(data, {
        x: "label",
        y: "count",
        fill: (datum) => datum.fill,
        radius: 0,
        key: "label",
        ...barEnterMotion,
        states: [
          {
            when: { focus: "primary" },
            style: { fillOpacity: 0.82 },
          },
        ],
      }),
    ],
    x: {
      scale: () => scaleBand<string>().padding(0.38),
      axis: rotateXLabels
        ? {
            ...modernAxisPresentation,
            tickLabels: { rotate: -40, thin: false },
          }
        : modernAxisPresentation,
    },
    y: modernValueAxis,
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<BarDatum>) {
        const datum = point.datum;
        return `${datum.label}: ${datum.count.toLocaleString()}`;
      },
    },
  }) as DomChartDefinition;

export const createHorizontalBarChartDefinition = ({
  data,
}: {
  data: BarDatum[];
}): DomChartDefinition =>
  defineChart({
    ...chartMotion,
    marks: [
      barX(data, {
        x: "count",
        y: "label",
        fill: (datum) => datum.fill,
        radius: 0,
        key: "label",
        ...barEnterMotion,
        states: [
          {
            when: { focus: "primary" },
            style: { fillOpacity: 0.82 },
          },
        ],
      }),
    ],
    x: modernValueAxis,
    y: {
      scale: () => scaleBand<string>().padding(0.38),
      axis: modernAxisPresentation,
    },
    tooltip: {
      ...chartTooltip,
      format(point: ChartPoint<BarDatum>) {
        const datum = point.datum;
        return `${datum.label}: ${datum.count.toLocaleString()}`;
      },
    },
  }) as DomChartDefinition;

const PIE_SLICE_PAD = 0.018;

const buildPieSlices = (data: PieDatum[]) =>
  pie<PieDatum>()
    .sort(null)
    .value((datum) => datum.count)
    .padAngle(PIE_SLICE_PAD)([...data]);

const createPiePolarMark = (
  slices: PieArcDatum<PieDatum>[],
  fill: (slice: PieArcDatum<PieDatum>) => string,
) =>
  polar({
    inset: 4,
    radiusRatio: 0.9,
    marks: [
      radialArc(slices, {
        startAngle: "startAngle",
        endAngle: "endAngle",
        padAngle: "padAngle",
        innerRadius: (layout) => layout.radius * 0.56,
        cornerRadius: 0,
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
}): DomChartDefinition => {
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
  }) as DomChartDefinition;
};

export const createDistributionPieChartDefinition = ({
  data,
  colors,
}: {
  data: PieDatum[];
  colors: string[];
}): DomChartDefinition =>
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
