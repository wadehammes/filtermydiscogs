import { DASHBOARD_BAR_DRILLDOWN_HINT } from "src/constants/dashboardCopy.constants";
import drilldownStyles from "src/styles/modules/dashboard-drilldown.module.css";

export const DashboardBarDrilldownHint = () => (
  <p className={drilldownStyles.barHint}>{DASHBOARD_BAR_DRILLDOWN_HINT}</p>
);
