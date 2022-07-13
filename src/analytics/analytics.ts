import { isBrowser } from "src/utils/helpers";

interface GTMPageEventProps {
  event: string;
  page: string;
}

interface EventProps {
  category: string;
  action: string;
  label: string;
  value: string | boolean;
  [key: string]: string | number | boolean;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed for GA datalayer
    dataLayer: any[];
  }
}

export const addDataLayer = () =>
  isBrowser() && (window.dataLayer = window.dataLayer || []);

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
