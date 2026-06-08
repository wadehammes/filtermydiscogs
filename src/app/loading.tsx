"use client";

import { usePathname } from "next/navigation";
import { AuthenticatedRouteLoading } from "src/components/AppPageLoading/AuthenticatedRouteLoading.component";
import { isAuthenticatedAppPath } from "src/components/AppPageLoading/appPageLoading.config";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { useAuth } from "src/context/auth.context";

/**
 * Root loading UI.
 * Public routes keep the marketing header; authenticated app routes keep StickyHeaderBar.
 */
export default function RootLoading() {
  const pathname = usePathname();
  const {
    state: { isAuthenticated },
  } = useAuth();

  if (isAuthenticated && isAuthenticatedAppPath(pathname)) {
    return <AuthenticatedRouteLoading />;
  }

  return (
    <PublicAuthLayout>
      <PageLoader message="Loading..." size="3xl" fullHeight />
    </PublicAuthLayout>
  );
}
