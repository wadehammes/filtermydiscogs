import { useEffect } from "react";

interface PerformanceMetrics {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
}

export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const metrics: PerformanceMetrics = {};

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case "paint":
            if (entry.name === "first-contentful-paint") {
              metrics.fcp = entry.startTime;
            }
            break;
          case "largest-contentful-paint":
            metrics.lcp = entry.startTime;
            break;
          case "first-input":
            metrics.fid =
              (entry as PerformanceEventTiming).processingStart -
              entry.startTime;
            break;
          case "layout-shift": {
            const layoutShiftEntry = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            };
            if (!layoutShiftEntry.hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + (layoutShiftEntry.value || 0);
            }
            break;
          }
          case "navigation":
            metrics.ttfb =
              (entry as PerformanceNavigationTiming).responseStart -
              (entry as PerformanceNavigationTiming).requestStart;
            break;
        }
      }
    });

    try {
      observer.observe({
        entryTypes: [
          "paint",
          "largest-contentful-paint",
          "first-input",
          "layout-shift",
          "navigation",
        ],
      });
    } catch (error) {
      console.warn("Performance Observer not supported:", error);
    }

    const reportMetrics = () => {
      if (Object.keys(metrics).length > 0) {
        if (
          typeof window !== "undefined" &&
          (window as Window & { gtag?: Function }).gtag
        ) {
          (window as unknown as Window & { gtag: Function }).gtag(
            "event",
            "performance_metrics",
            {
              event_category: "Performance",
              event_label: "Core Web Vitals",
              custom_map: {
                fcp: metrics.fcp,
                lcp: metrics.lcp,
                fid: metrics.fid,
                cls: metrics.cls,
                ttfb: metrics.ttfb,
              },
            },
          );
        }
      }
    };

    const timeoutId = setTimeout(reportMetrics, 5000);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);
};
