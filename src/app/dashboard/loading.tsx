"use client";

import PageLoader from "src/components/PageLoader/PageLoader.component";

/**
 * Loading UI for the dashboard page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function DashboardLoading() {
  return <PageLoader message="Loading dashboard..." size="3xl" fullHeight />;
}
