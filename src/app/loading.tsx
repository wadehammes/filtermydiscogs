"use client";

import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";

/**
 * Root loading UI.
 * Keeps the public header visible while the initial page streams in.
 */
export default function RootLoading() {
  return (
    <PublicAuthLayout>
      <PageLoader message="Loading..." size="3xl" fullHeight />
    </PublicAuthLayout>
  );
}
