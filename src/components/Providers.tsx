"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import LogoutOverlay from "src/components/LogoutOverlay/LogoutOverlay.component";
import { AuthProvider, useAuth } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";

interface ProvidersProps {
  children: React.ReactNode;
}

function LogoutOverlayWrapper() {
  const { state: authState } = useAuth();
  return <LogoutOverlay isVisible={authState.isLoggingOut} />;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
          },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}
