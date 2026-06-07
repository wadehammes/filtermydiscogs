import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { JotaiProvider } from "src/atoms/JotaiProvider";
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
};

export const TestProviders = ({
  children,
  queryClient: queryClientOverride,
  authInitialState,
  skipInitialAuthCheck = true,
}: TestProvidersProps) => {
  const defaultQueryClient = useMemo(() => createTestQueryClient(), []);
  const queryClient = queryClientOverride ?? defaultQueryClient;
  const resolvedAuthInitialState =
    authInitialState ??
    (skipInitialAuthCheck ? testUnauthenticatedAuthState : undefined);

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ThemeProvider>
          <AuthProvider
            {...(resolvedAuthInitialState !== undefined
              ? { initialState: resolvedAuthInitialState }
              : {})}
            skipInitialAuthCheck={skipInitialAuthCheck}
          >
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

export { testAuthenticatedAuthState, testUnauthenticatedAuthState };
