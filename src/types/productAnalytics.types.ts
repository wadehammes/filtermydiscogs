export interface ProductAnalyticsEventInput {
  event: string;
  category: string;
  action: string;
  label: string;
  value?: string | null;
  page_path?: string | null;
}

export const PRODUCT_ANALYTICS_MAX_BATCH_SIZE = 20;

export interface AdminStatsFeatureUsageRow {
  key: string;
  label: string;
  last7Days: number;
  last30Days: number;
}

export interface AdminStatsFeatureUsage {
  totals: {
    last7Days: number;
    last30Days: number;
  };
  pageViews: AdminStatsFeatureUsageRow[];
  events: AdminStatsFeatureUsageRow[];
}
