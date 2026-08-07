"use client";

import { getChartColor } from "src/utils/chartColors";
import { getPieLegendPercent } from "src/utils/tanstackCharts";
import styles from "./PieChartLegend.module.css";

export interface PieLegendItem {
  label: string;
  count: number;
  percentage?: number;
}

interface PieChartLegendProps {
  data: PieLegendItem[];
  colors: string[];
  colorByLabel?: Map<string, string>;
}

export const PieChartLegend = ({
  data,
  colors,
  colorByLabel,
}: PieChartLegendProps) => (
  <ul className={styles.legend}>
    {data.map((item, index) => (
      <li className={styles.legendItem} key={item.label}>
        <span
          aria-hidden
          className={styles.swatch}
          style={{
            backgroundColor:
              colorByLabel?.get(item.label) ?? getChartColor(colors, index),
          }}
        />
        <span className={styles.legendText}>
          {item.label} ({getPieLegendPercent(data, item)}%)
        </span>
      </li>
    ))}
  </ul>
);
