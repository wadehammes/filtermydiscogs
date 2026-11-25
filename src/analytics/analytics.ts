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
};
