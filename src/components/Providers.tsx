"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import LogoutOverlay from "src/components/LogoutOverlay/LogoutOverlay.component";
import { AuthProvider, useAuth } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { ViewProvider } from "src/context/view.context";
import { usePerformanceMonitoring } from "src/hooks/usePerformanceMonitoring.hook";

interface ProvidersProps {
  children: React.ReactNode;
}

function LogoutOverlayWrapper() {
  const { state: authState } = useAuth();
  return <LogoutOverlay isVisible={authState.isLoggingOut} />;
}

export function Providers({ children }: ProvidersProps) {
  usePerformanceMonitoring();

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollectionContextProvider>
          <FiltersProvider>
            <CrateProvider>
              <ViewProvider>
                {children}
                <LogoutOverlayWrapper />
              </ViewProvider>
            </CrateProvider>
          </FiltersProvider>
        </CollectionContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
