"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { isProtectedAppRoute } from "src/constants/protectedRoutes";
import { useAuth } from "src/context/auth.context";
import { useAuthenticatedGatePathname } from "src/hooks/useAuthenticatedGatePathname.hook";

const AuthenticatedProvidersLazy = dynamic(
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
  const pathname = useAuthenticatedGatePathname();
  const { state: authState } = useAuth();
  const onProtectedRoute = isProtectedAppRoute(pathname);
  const shouldWrapAuthenticatedProviders =
    authState.isAuthenticated || (authState.isCheckingAuth && onProtectedRoute);

  useEffect(() => {
    if (shouldWrapAuthenticatedProviders) {
      void import("src/components/AuthenticatedProviders");
    }
  }, [shouldWrapAuthenticatedProviders]);

  if (shouldWrapAuthenticatedProviders) {
    return <AuthenticatedProvidersLazy>{children}</AuthenticatedProvidersLazy>;
  }

  return children;
};

export const AuthenticatedProvidersGate = ({
  children,
}: AuthenticatedProvidersGateProps) => (
  <Suspense fallback={children}>
    <AuthenticatedProvidersGateInner>
      {children}
    </AuthenticatedProvidersGateInner>
  </Suspense>
);
