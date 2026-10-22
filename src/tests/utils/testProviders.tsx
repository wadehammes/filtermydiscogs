import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { JotaiProvider } from "src/atoms/JotaiProvider";
import { CollectionDataSync } from "src/components/CollectionDataSync/CollectionDataSync.component";
import { AnalyticsConsentProvider } from "src/context/analyticsConsent.context";
import { AuthProvider, type AuthState } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FeatureFlagProvider } from "src/context/featureFlags.context";
import { FiltersProvider } from "src/context/filters.context";
import { PlaybackReleaseClickProvider } from "src/context/playbackReleaseClick.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import {
  DEFAULT_FEATURE_FLAGS,
  type FeatureFlags,
} from "src/types/featureFlags.types";
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
  includeCollectionSync?: boolean;
  featureFlags?: FeatureFlags;
};

export const AppTestProviders = ({
  children,
  queryClient,
  authInitialState,
  skipInitialAuthCheck = true,
  includeCollectionSync = true,
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
                  <ViewProvider>
                    {includeCollectionSync ? <CollectionDataSync /> : null}
                    {children}
                  </ViewProvider>
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
  includeCollectionSync = true,
  featureFlags = { ...DEFAULT_FEATURE_FLAGS, playlists: true },
}: TestProvidersProps) => (
  <AppTestProviders
    {...(queryClient !== undefined ? { queryClient } : {})}
    {...(authInitialState !== undefined ? { authInitialState } : {})}
    skipInitialAuthCheck={skipInitialAuthCheck}
    includeCollectionSync={includeCollectionSync}
  >
    <PlaybackReleaseClickProvider>
      <FeatureFlagProvider featureFlags={featureFlags}>
        {includeCrate ? <CrateProvider>{children}</CrateProvider> : children}
      </FeatureFlagProvider>
    </PlaybackReleaseClickProvider>
  </AppTestProviders>
);

export { testAuthenticatedAuthState, testUnauthenticatedAuthState };
