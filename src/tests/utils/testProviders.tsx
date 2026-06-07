import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { JotaiProvider } from "src/atoms/JotaiProvider";
import { AuthProvider } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import { createTestQueryClient } from "./testQueryClient";

export const TestProviders = ({
  children,
  queryClient: queryClientOverride,
}: {
  children: ReactNode;
  queryClient?: QueryClient;
}) => {
  const defaultQueryClient = useMemo(() => createTestQueryClient(), []);
  const queryClient = queryClientOverride ?? defaultQueryClient;

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ThemeProvider>
          <AuthProvider>
            <CollectionContextProvider>
              <FiltersProvider>
                <CrateProvider>
                  <ViewProvider>{children}</ViewProvider>
                </CrateProvider>
              </FiltersProvider>
            </CollectionContextProvider>
          </AuthProvider>
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};
