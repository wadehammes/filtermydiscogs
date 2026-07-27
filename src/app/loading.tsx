"use client";

import { PageLoader } from "src/components/PageLoader/PageLoader.component";

/**
 * Root loading UI. Keep free of `useAuth` / Providers — Next also mounts this
 * under `/_global-error`, which replaces the root layout. Authenticated route
 * shells live in segment `loading.tsx` files (`releases`, `dashboard`, `mosaic`).
 */
export default function RootLoading() {
  return <PageLoader message="Loading..." size="3xl" fullHeight />;
}
