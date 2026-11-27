export const buildDashboardDrilldownTooltip = (filterLabel: string): string =>
  `Open your collection filtered by ${filterLabel}`;

export const buildDashboardDrilldownAriaLabel = (filterLabel: string): string =>
  buildDashboardDrilldownTooltip(filterLabel);
