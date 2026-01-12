"use client";

import PageLoader from "src/components/PageLoader/PageLoader.component";

/**
 * Root loading UI.
 * Shows instantly while the root layout or initial page is loading.
 */
export default function RootLoading() {
  return <PageLoader message="Loading..." size="3xl" fullHeight />;
}
