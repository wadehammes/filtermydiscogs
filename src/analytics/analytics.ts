import { isBrowser } from "src/utils/helpers";

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

export const trackEvent = (event: string, properties: EventProps) => {
  if (isBrowser()) {
    window.dataLayer = window.dataLayer || [];
  }

  window.dataLayer?.push({ event, ...properties });
};
