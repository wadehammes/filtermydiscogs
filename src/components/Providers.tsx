"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { preconnect } from "react-dom";
import { JotaiProvider } from "src/atoms/JotaiProvider";
import { AuthenticatedCollectionSyncGate } from "src/components/AuthenticatedCollectionSyncGate.component";
import { AuthenticatedProvidersGate } from "src/components/AuthenticatedProvidersGate.component";
import { CollectionCachePrepGate } from "src/components/CollectionCachePrepGate/CollectionCachePrepGate.component";
import { CookieConsentBanner } from "src/components/CookieConsentBanner/CookieConsentBanner.component";
import { AnalyticsPageViewTracker } from "src/components/GoogleTagManagerLoader/AnalyticsPageViewTracker.component";
import { GoogleTagManagerLoader } from "src/components/GoogleTagManagerLoader/GoogleTagManagerLoader.component";
import { WebVitalsReporter } from "src/components/GoogleTagManagerLoader/WebVitalsReporter.component";
import { LogoutOverlay } from "src/components/LogoutOverlay/LogoutOverlay.component";
import { SentryUserFeedbackDialogHost } from "src/components/SentryUserFeedbackDialog/SentryUserFeedbackDialog.component";
import {
  RootToastManager,
  SessionToastManager,
} from "src/components/ToastManager/ToastManager.component";
import { AnalyticsConsentProvider } from "src/context/analyticsConsent.context";
import { AuthProvider, useAuth } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { PlaybackReleaseClickProvider } from "src/context/playbackReleaseClick.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import { useSentryUserSync } from "src/hooks/useSentryUserSync.hook";
import { useUserPreferencesSync } from "src/hooks/useUserPreferencesSync.hook";

interface ProvidersProps {
  children: React.ReactNode;
}

const DiscogsImagePreconnect = () => {
  preconnect("https://i.discogs.com", { crossOrigin: "anonymous" });
  preconnect("https://img.discogs.com", { crossOrigin: "anonymous" });
  return null;
};

const LogoutOverlayWrapper = () => {
  const { state: authState } = useAuth();
  return <LogoutOverlay isVisible={authState.isLoggingOut} />;
};

const UserPreferencesSync = () => {
  useUserPreferencesSync();
  return null;
};

const SentryUserSync = () => {
  useSentryUserSync();
  return null;
};

const AnalyticsShell = ({ children }: { children: React.ReactNode }) => (
  <AnalyticsConsentProvider>
    <UserPreferencesSync />
    <GoogleTagManagerLoader />
    <AnalyticsPageViewTracker />
    <WebVitalsReporter />
    {children}
    <CookieConsentBanner />
  </AnalyticsConsentProvider>
);

export const Providers = ({ children }: ProvidersProps) => {
  const queryClient = useMemo(() => {
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onSuccess: (_data, _variables, _context, mutation) => {
          const invalidates = mutation.meta?.invalidates;
          if (!invalidates?.length) {
            return;
          }

          for (const queryKey of invalidates) {
            void client.invalidateQueries({ queryKey });
          }
        },
      }),
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
    });

    return client;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DiscogsImagePreconnect />
      <JotaiProvider>
        <ThemeProvider>
          <AuthProvider>
            <SentryUserSync />
            <CollectionContextProvider>
              <FiltersProvider>
                <ViewProvider>
                  <PlaybackReleaseClickProvider>
                    <CrateProvider>
                      <CollectionCachePrepGate />
                      <AuthenticatedCollectionSyncGate />
                      <AuthenticatedProvidersGate>
                        <AnalyticsShell>
                          {children}
                          <LogoutOverlayWrapper />
                          <SessionToastManager />
                          <SentryUserFeedbackDialogHost />
                        </AnalyticsShell>
                      </AuthenticatedProvidersGate>
                    </CrateProvider>
                  </PlaybackReleaseClickProvider>
                </ViewProvider>
              </FiltersProvider>
            </CollectionContextProvider>
          </AuthProvider>
          <RootToastManager />
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};
