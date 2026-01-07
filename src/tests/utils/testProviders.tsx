import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { AuthProvider } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import { createTestQueryClient } from "./testQueryClient";

export const TestProviders = ({ children }: { children: ReactNode }) => {
  const queryClient = useMemo(() => createTestQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
};
