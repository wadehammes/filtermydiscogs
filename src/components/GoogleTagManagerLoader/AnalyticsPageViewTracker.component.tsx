"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { trackEvent } from "src/analytics/analytics";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/about": "About",
  "/admin": "Admin",
  "/crates": "Crates",
  "/dashboard": "Dashboard",
  "/legal": "Legal",
  "/mosaic": "Mosaic",
  "/releases": "Releases",
  "/settings": "Settings",
};

const resolvePageLabel = (pathname: string): string => {
  if (PAGE_LABELS[pathname]) {
    return PAGE_LABELS[pathname];
  }

  if (pathname.startsWith("/crate/")) {
    return "Public crate";
  }

  if (pathname.startsWith("/crates/")) {
    return "Crate detail";
  }

  return pathname;
};

const AnalyticsPageViewTrackerInner = () => {
  const pathname = usePathname();
  const { isAnalyticsEnabled, isReady } = useAnalyticsConsent();
  const previousPathRef = useRef<string | null>(null);
  const wasAnalyticsEnabledRef = useRef(false);

  useEffect(() => {
    if (!(isReady && pathname)) {
      return;
    }

    if (!isAnalyticsEnabled) {
      wasAnalyticsEnabledRef.current = false;
      return;
    }

    const shouldTrack =
      pathname !== previousPathRef.current || !wasAnalyticsEnabledRef.current;
    wasAnalyticsEnabledRef.current = true;

    if (!shouldTrack) {
      return;
    }

    previousPathRef.current = pathname;

    trackEvent("pageView", {
      category: "navigation",
      action: "pageView",
      label: resolvePageLabel(pathname),
      value: pathname,
    });
  }, [isAnalyticsEnabled, isReady, pathname]);

  return null;
};

export const AnalyticsPageViewTracker = () => (
  <Suspense fallback={null}>
    <AnalyticsPageViewTrackerInner />
  </Suspense>
);
