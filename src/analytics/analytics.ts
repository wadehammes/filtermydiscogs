import { isBrowser } from "src/utils/helpers";

interface GTMPageEventProps {
  event: string;
  page: string;
  [key: string]: unknown;
}

interface EventProps {
  category: string;
  action: string;
  label: string;
  value: string | boolean;
  [key: string]: string | number | boolean;
}

// Define a proper type for Google Analytics dataLayer
type DataLayerItem = Record<string, unknown>;

// Extend Window interface to include dataLayer
declare global {
  interface Window {
    dataLayer?: DataLayerItem[];
  }
}

export const addDataLayer = () => {
  if (isBrowser()) {
    window.dataLayer = window.dataLayer || [];
  }
};

export const trackEvent = (event: string, properties: EventProps) => {
  window.dataLayer?.push({ event, ...properties });
};

export const trackPageView = (url: string): void => {
  const pageEvent: GTMPageEventProps = {
    event: "pageview",
    page: url,
  };

  window.dataLayer?.push(pageEvent);
};
