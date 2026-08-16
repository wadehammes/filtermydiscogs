import { queueProductAnalyticsEvent } from "src/analytics/productAnalyticsClient";
import { isAnalyticsConsentGranted } from "src/utils/analyticsConsentStorage";
import { isBrowser } from "src/utils/helpers";

interface EventProps {
  category: string;
  action: string;
  label: string;
  value: string | boolean;
  [key: string]: string | number | boolean;
}

type DataLayerItem = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerItem[];
  }
}

export const trackEvent = (event: string, properties: EventProps) => {
  if (!(isBrowser() && isAnalyticsConsentGranted())) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...properties });

  queueProductAnalyticsEvent({
    event,
    category: properties.category,
    action: properties.action,
    label: properties.label,
    value:
      typeof properties.value === "boolean"
        ? properties.value
          ? "true"
          : "false"
        : String(properties.value),
    page_path: window.location.pathname,
  });
};
