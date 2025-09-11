"use client";

import type { PerformanceMetrics } from "src/types";

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};

  constructor() {
    this.initObservers();
  }

  private initObservers() {
    if (typeof window !== "undefined" && "PerformanceObserver" in window) {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(
          (entry) => entry.name === "first-contentful-paint",
        );
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          this.logMetric("FCP", fcpEntry.startTime);
        }
      });
      fcpObserver.observe({ entryTypes: ["paint"] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.metrics.lcp = lastEntry.startTime;
          this.logMetric("LCP", lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime;
          this.logMetric("FID", this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: PerformanceEntry) => {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.logMetric("CLS", clsValue);
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    }

    // Time to First Byte
    if (window?.performance) {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.logMetric("TTFB", this.metrics.ttfb);
      }
    }
  }

  private logMetric(name: string, value: number) {
    console.log(`Performance Metric - ${name}: ${value.toFixed(2)}ms`);

    // Send to analytics if available
    if (window?.dataLayer) {
      window.dataLayer.push({
        event: "performance_metric",
        metric_name: name,
        metric_value: value,
      });
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public measureTimeToInteractive(): number {
    if (typeof window === "undefined") return 0;

    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (!navigation) return 0;

    return navigation.loadEventEnd - navigation.fetchStart;
  }

  public measureBundleSize(): void {
    if (typeof window === "undefined") return;

    const resources = performance.getEntriesByType("resource");
    const totalSize = resources.reduce((acc, resource) => {
      const transferSize =
        (resource as PerformanceResourceTiming).transferSize || 0;
      return acc + transferSize;
    }, 0);

    console.log(`Total Bundle Size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
  }
}

export const performanceMonitor = new PerformanceMonitor();
