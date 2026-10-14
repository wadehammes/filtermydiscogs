"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackWebVital } from "src/analytics/productAnalyticsEvents";

export const WebVitalsReporter = () => {
  useReportWebVitals((metric) => {
    trackWebVital(metric);
  });

  return null;
};
