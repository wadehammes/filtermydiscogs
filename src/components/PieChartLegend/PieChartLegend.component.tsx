"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { DashboardDrilldownFacetControl } from "src/components/Dashboard/DashboardDrilldownFacetControl.component";
import drilldownStyles from "src/styles/modules/dashboard-drilldown.module.css";
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
  colorByLabel?: Map<string, string> | undefined;
  onLabelSelect?: ((item: PieLegendItem) => void) | undefined;
}

export const PieChartLegend = ({
  data,
  colors,
  colorByLabel,
  onLabelSelect,
}: PieChartLegendProps) => (
  <Tooltip.Provider closeDelay={80} delay={300}>
    <ul className={styles.legend}>
      {data.map((item, index) => {
        const percentLabel = `${item.label} (${getPieLegendPercent(data, item)}%)`;
        const swatch = (
          <span
            aria-hidden
            className={styles.swatch}
            style={{
              backgroundColor:
                colorByLabel?.get(item.label) ?? getChartColor(colors, index),
            }}
          />
        );

        return (
          <li className={styles.legendItem} key={item.label}>
            {onLabelSelect === undefined ? (
              <>
                {swatch}
                <span className={styles.legendText}>{percentLabel}</span>
              </>
            ) : (
              <DashboardDrilldownFacetControl
                className={drilldownStyles.legendAction}
                filterLabel={item.label}
                onPress={() => onLabelSelect(item)}
              >
                {swatch}
                <span className={drilldownStyles.legendTextInteractive}>
                  {percentLabel}
                </span>
              </DashboardDrilldownFacetControl>
            )}
          </li>
        );
      })}
    </ul>
  </Tooltip.Provider>
);
