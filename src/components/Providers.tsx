"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { JotaiProvider } from "src/atoms/JotaiProvider";
import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { AuthCheckingToast } from "src/components/AuthCheckingToast/AuthCheckingToast.component";
import { CookieConsentBanner } from "src/components/CookieConsentBanner/CookieConsentBanner.component";
import { GoogleTagManagerLoader } from "src/components/GoogleTagManagerLoader/GoogleTagManagerLoader.component";
import { LogoutOverlay } from "src/components/LogoutOverlay/LogoutOverlay.component";
import { GlobalPlaybackDock } from "src/components/ReleasePlayback/GlobalPlaybackDock.component";
import { AnalyticsConsentProvider } from "src/context/analyticsConsent.context";
import { AuthProvider, useAuth } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { CrateProvider } from "src/context/crate.context";
import { FiltersProvider } from "src/context/filters.context";
import { PlaybackReleaseClickProvider } from "src/context/playbackReleaseClick.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import { useUserPreferencesSync } from "src/hooks/useUserPreferencesSync.hook";

interface ProvidersProps {
  children: React.ReactNode;
}

const LogoutOverlayWrapper = () => {
  const { state: authState } = useAuth();
  return <LogoutOverlay isVisible={authState.isLoggingOut} />;
};

const UserPreferencesSync = () => {
  useUserPreferencesSync();
  return null;
};

const AnalyticsShell = ({ children }: { children: React.ReactNode }) => (
  <AnalyticsConsentProvider>
    <UserPreferencesSync />
    <GoogleTagManagerLoader />
    {children}
    <CookieConsentBanner />
  </AnalyticsConsentProvider>
);

export const Providers = ({ children }: ProvidersProps) => {
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
      <JotaiProvider>
        <ThemeProvider>
          <AuthProvider>
            <CollectionContextProvider>
              <FiltersProvider>
                <ReleasePlaybackProvider>
                  <PlaybackReleaseClickProvider>
                    <CrateProvider>
                      <ViewProvider>
                        <AnalyticsShell>
                          {children}
                          <GlobalPlaybackDock />
                          <LogoutOverlayWrapper />
                          <AuthCheckingToast />
                        </AnalyticsShell>
                      </ViewProvider>
                    </CrateProvider>
                  </PlaybackReleaseClickProvider>
                </ReleasePlaybackProvider>
              </FiltersProvider>
            </CollectionContextProvider>
          </AuthProvider>
          <AppToaster />
        </ThemeProvider>
      </JotaiProvider>
    </QueryClientProvider>
  );
};
