"use client";

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { JotaiProvider } from "src/atoms/JotaiProvider";
import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { AuthCheckingToast } from "src/components/AuthCheckingToast/AuthCheckingToast.component";
import { AuthenticatedCollectionSyncGate } from "src/components/AuthenticatedCollectionSyncGate.component";
import { AuthenticatedProvidersGate } from "src/components/AuthenticatedProvidersGate.component";
import { CollectionCachePrepGate } from "src/components/CollectionCachePrepGate/CollectionCachePrepGate.component";
import { CollectionLoadingToast } from "src/components/CollectionLoadingToast/CollectionLoadingToast.component";
import { CookieConsentBanner } from "src/components/CookieConsentBanner/CookieConsentBanner.component";
import { DeploymentUpdateToast } from "src/components/DeploymentUpdateToast/DeploymentUpdateToast.component";
import { DiscogsOutageToast } from "src/components/DiscogsOutageToast/DiscogsOutageToast.component";
import { DonationSuccessToast } from "src/components/DonationSuccessToast/DonationSuccessToast.component";
import { AnalyticsPageViewTracker } from "src/components/GoogleTagManagerLoader/AnalyticsPageViewTracker.component";
import { GoogleTagManagerLoader } from "src/components/GoogleTagManagerLoader/GoogleTagManagerLoader.component";
import { WebVitalsReporter } from "src/components/GoogleTagManagerLoader/WebVitalsReporter.component";
import { LogoutOverlay } from "src/components/LogoutOverlay/LogoutOverlay.component";
import { SentryUserFeedbackDialogHost } from "src/components/SentryUserFeedbackDialog/SentryUserFeedbackDialog.component";
import { SupportProjectToast } from "src/components/SupportProjectToast/SupportProjectToast.component";
import { AnalyticsConsentProvider } from "src/context/analyticsConsent.context";
import { AuthProvider, useAuth } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FeatureFlagProvider } from "src/context/featureFlags.context";
import { FiltersProvider } from "src/context/filters.context";
import { PlaybackReleaseClickProvider } from "src/context/playbackReleaseClick.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import { useReleaseCardCoverBlurTierSync } from "src/hooks/useReleaseCardCoverBlurTierSync.hook";
import { useSentryUserSync } from "src/hooks/useSentryUserSync.hook";
import { useUserPreferencesSync } from "src/hooks/useUserPreferencesSync.hook";
import type { FeatureFlags } from "src/types/featureFlags.types";

interface ProvidersProps {
  children: React.ReactNode;
  featureFlags: FeatureFlags;
}

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

const ReleaseCardCoverBlurTierSync = () => {
  useReleaseCardCoverBlurTierSync();
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

export const Providers = ({ children, featureFlags }: ProvidersProps) => {
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
      <JotaiProvider>
        <ThemeProvider>
          <ReleaseCardCoverBlurTierSync />
          <AuthProvider>
            <SentryUserSync />
            <FeatureFlagProvider featureFlags={featureFlags}>
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
                            <AuthCheckingToast />
                            <CollectionLoadingToast />
                            <DeploymentUpdateToast />
                            <DiscogsOutageToast />
                            <SupportProjectToast />
                            <SentryUserFeedbackDialogHost />
                          </AnalyticsShell>
                        </AuthenticatedProvidersGate>
                      </CrateProvider>
                    </PlaybackReleaseClickProvider>
                  </ViewProvider>
                </FiltersProvider>
              </CollectionContextProvider>
            </FeatureFlagProvider>
          </AuthProvider>
          <AppToaster />
          <DonationSuccessToast />
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};
