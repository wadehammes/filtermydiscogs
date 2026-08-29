"use client";

import { GlobalPlaybackDock } from "src/components/GlobalPlaybackDock/GlobalPlaybackDock.component";
import { CrateProvider } from "src/context/crate.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

export const AuthenticatedProviders = ({
  children,
}: AuthenticatedProvidersProps) => (
  <ReleasePlaybackProvider>
    <CrateProvider>
      {children}
      <GlobalPlaybackDock />
    </CrateProvider>
  </ReleasePlaybackProvider>
);
