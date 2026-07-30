import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { JotaiProvider } from "src/atoms/JotaiProvider";
import { AnalyticsConsentProvider } from "src/context/analyticsConsent.context";
import { AuthProvider, type AuthState } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import {
  testAuthenticatedAuthState,
  testUnauthenticatedAuthState,
} from "./testAuthStates";
import { createTestQueryClient } from "./testQueryClient";

export type TestProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
  authInitialState?: AuthState;
  skipInitialAuthCheck?: boolean;
  includeCrate?: boolean;
};

export const AppTestProviders = ({
  children,
  queryClient,
  authInitialState,
  skipInitialAuthCheck = true,
}: Omit<TestProvidersProps, "includeCrate">) => {
  const defaultQueryClient = useMemo(() => createTestQueryClient(), []);
  const resolvedQueryClient = queryClient ?? defaultQueryClient;
  const resolvedAuthInitialState =
    authInitialState ??
    (skipInitialAuthCheck ? testUnauthenticatedAuthState : undefined);

  return (
    <QueryClientProvider client={resolvedQueryClient}>
      <JotaiProvider>
        <ThemeProvider>
          <AuthProvider
            {...(resolvedAuthInitialState !== undefined
              ? { initialState: resolvedAuthInitialState }
              : {})}
            skipInitialAuthCheck={skipInitialAuthCheck}
          >
            <AnalyticsConsentProvider>
              <CollectionContextProvider>
                <FiltersProvider>
                  <ViewProvider>{children}</ViewProvider>
                </FiltersProvider>
              </CollectionContextProvider>
            </AnalyticsConsentProvider>
          </AuthProvider>
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};

export const TestProviders = ({
  children,
  queryClient,
  authInitialState,
  skipInitialAuthCheck = true,
  includeCrate = true,
}: TestProvidersProps) => (
  <AppTestProviders
    {...(queryClient !== undefined ? { queryClient } : {})}
    {...(authInitialState !== undefined ? { authInitialState } : {})}
    skipInitialAuthCheck={skipInitialAuthCheck}
  >
    {includeCrate ? <CrateProvider>{children}</CrateProvider> : children}
  </AppTestProviders>
);

export { testAuthenticatedAuthState, testUnauthenticatedAuthState };
