"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import { isProtectedAppRoute } from "src/constants/protectedRoutes";
import { useAuth } from "src/context/auth.context";

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
  const pathname = usePathname();
  const { state: authState } = useAuth();
  const onProtectedRoute = isProtectedAppRoute(pathname);
  const needsAuthenticatedShell =
    authState.isAuthenticated || (authState.isCheckingAuth && onProtectedRoute);

  useEffect(() => {
    if (needsAuthenticatedShell) {
      void import("src/components/AuthenticatedProviders");
    }
  }, [needsAuthenticatedShell]);

  if (needsAuthenticatedShell) {
    return <AuthenticatedProvidersLazy>{children}</AuthenticatedProvidersLazy>;
  }

  if (!onProtectedRoute) {
    return <PlaybackProvidersShell>{children}</PlaybackProvidersShell>;
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
