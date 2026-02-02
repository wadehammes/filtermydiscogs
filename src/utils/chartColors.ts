import { useMemo } from "react";
import { useTheme } from "src/context/theme.context";

const DEFAULT_CHART_COLOR = "#5e5365";

export function getChartColor(colors: string[], index: number): string {
  return colors[index % colors.length] ?? colors[0] ?? DEFAULT_CHART_COLOR;
}

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return useMemo(
    () => [
      isLight ? DEFAULT_CHART_COLOR : "#a855f7",
      "#f05278",
      "#54bd83",
      "#f37231",
      isLight ? "#d4af37" : "#fbdf4a",
      "#7153a2",
      "#a1ce53",
      "#61ccf0",
      "#f68933",
      isLight ? "#c9a227" : "#fcee21",
      "#908795",
      "#e1e1e1",
      "#fce3e9",
    ],
    [isLight],
  );
}
