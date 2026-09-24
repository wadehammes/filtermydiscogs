"use client";

import { GlobalPlaybackDock } from "src/components/GlobalPlaybackDock/GlobalPlaybackDock.component";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";

interface PlaybackProvidersShellProps {
  children: React.ReactNode;
}

export const PlaybackProvidersShell = ({
  children,
}: PlaybackProvidersShellProps) => (
  <ReleasePlaybackProvider>
    {children}
    <GlobalPlaybackDock />
  </ReleasePlaybackProvider>
);
