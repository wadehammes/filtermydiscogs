"use client";

import { GlobalPlaybackDock } from "src/components/GlobalPlaybackDock/GlobalPlaybackDock.component";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

export const AuthenticatedProviders = ({
  children,
}: AuthenticatedProvidersProps) => (
  <ReleasePlaybackProvider>
    {children}
    <GlobalPlaybackDock />
  </ReleasePlaybackProvider>
);
