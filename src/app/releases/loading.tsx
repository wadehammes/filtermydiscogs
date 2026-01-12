"use client";

import PageLoader from "src/components/PageLoader/PageLoader.component";

/**
 * Loading UI for the releases page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function ReleasesLoadingPage() {
  return <PageLoader message="Loading releases..." size="3xl" fullHeight />;
}
