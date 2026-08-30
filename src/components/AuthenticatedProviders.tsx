"use client";

import { GlobalPlaybackDock } from "src/components/GlobalPlaybackDock/GlobalPlaybackDock.component";
import { PlaybackShellRegistryProvider } from "src/components/PlaybackPageShell/PlaybackShellRegistry.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

export const AuthenticatedProviders = ({
  children,
}: AuthenticatedProvidersProps) => (
  <ReleasePlaybackProvider>
    <PlaybackShellRegistryProvider>
      {children}
      <GlobalPlaybackDock />
    </PlaybackShellRegistryProvider>
  </ReleasePlaybackProvider>
);
