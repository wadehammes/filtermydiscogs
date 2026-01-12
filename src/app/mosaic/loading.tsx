"use client";

import PageLoader from "src/components/PageLoader/PageLoader.component";

/**
 * Loading UI for the mosaic page.
 * Shows instantly while the page is loading, improving perceived performance.
 */
export default function MosaicLoadingPage() {
  return <PageLoader message="Loading mosaic..." size="3xl" fullHeight />;
}
