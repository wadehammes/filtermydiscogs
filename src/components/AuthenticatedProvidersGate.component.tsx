"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useSyncExternalStore } from "react";
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

const clientSnapshot = (): boolean => true;

const serverSnapshot = (): boolean => false;

const subscribeNoop = (): (() => void) => () => {};

const useIsClient = (): boolean =>
  useSyncExternalStore(subscribeNoop, clientSnapshot, serverSnapshot);

interface AuthenticatedProvidersGateProps {
  children: React.ReactNode;
}

const AuthenticatedProvidersGateInner = ({
  children,
}: AuthenticatedProvidersGateProps) => {
  const pathname = useAuthenticatedGatePathname();
  const { state: authState } = useAuth();
  const isClient = useIsClient();
  const onProtectedRoute = isProtectedAppRoute(pathname);
  const shouldWrapAuthenticatedProviders =
    authState.isAuthenticated || (authState.isCheckingAuth && onProtectedRoute);

  useEffect(() => {
    if (shouldWrapAuthenticatedProviders) {
      void import("src/components/AuthenticatedProviders");
    }
  }, [shouldWrapAuthenticatedProviders]);

  if (shouldWrapAuthenticatedProviders && isClient) {
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
