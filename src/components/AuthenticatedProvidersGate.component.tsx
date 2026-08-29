"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { isProtectedAppRoute } from "src/constants/protectedRoutes";
import { useAuth } from "src/context/auth.context";

const AuthenticatedProviders = dynamic(
  () =>
    import("src/components/AuthenticatedProviders").then(
      (mod) => mod.AuthenticatedProviders,
    ),
  { ssr: false },
);

interface AuthenticatedProvidersGateProps {
  children: React.ReactNode;
}

const AuthenticatedProvidersGateInner = ({
  children,
}: AuthenticatedProvidersGateProps) => {
  const pathname = usePathname();
  const { state: authState } = useAuth();
  const onProtectedRoute = isProtectedAppRoute(pathname);
  const needsAuthenticatedShell =
    authState.isAuthenticated || (authState.isCheckingAuth && onProtectedRoute);

  if (!needsAuthenticatedShell) {
    return children;
  }

  return <AuthenticatedProviders>{children}</AuthenticatedProviders>;
};

export const AuthenticatedProvidersGate = ({
  children,
}: AuthenticatedProvidersGateProps) => (
  <Suspense fallback={children}>
    <AuthenticatedProvidersGateInner>{children}</AuthenticatedProvidersGateInner>
  </Suspense>
);
