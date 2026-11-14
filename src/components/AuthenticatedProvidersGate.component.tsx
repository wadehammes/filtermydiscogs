"use client";

import dynamic from "next/dynamic";
import { type ComponentType, Suspense, useEffect } from "react";
import { isProtectedAppRoute } from "src/constants/protectedRoutes";
import { useAuth } from "src/context/auth.context";
import { useAuthenticatedGatePathname } from "src/hooks/useAuthenticatedGatePathname.hook";
import { useIsClient } from "src/hooks/useIsClient.hook";

type AuthenticatedProvidersComponent = ComponentType<{
  children: React.ReactNode;
}>;

let authenticatedProvidersLoad:
  | Promise<AuthenticatedProvidersComponent>
  | undefined;

const loadAuthenticatedProviders =
  (): Promise<AuthenticatedProvidersComponent> => {
    authenticatedProvidersLoad ??= import(
      "src/components/AuthenticatedProviders"
    ).then((mod) => mod.AuthenticatedProviders);
    return authenticatedProvidersLoad;
  };

const AuthenticatedProvidersLazy = dynamic(loadAuthenticatedProviders, {
  ssr: false,
});

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
      void loadAuthenticatedProviders();
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
