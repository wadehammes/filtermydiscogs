"use client";

import { CollectionDataSync } from "src/components/CollectionDataSync/CollectionDataSync.component";
import { GlobalPlaybackDock } from "src/components/GlobalPlaybackDock/GlobalPlaybackDock.component";
import { CrateProvider } from "src/context/crate.context";
import { PlaybackReleaseClickProvider } from "src/context/playbackReleaseClick.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";

interface AuthenticatedProvidersProps {
  children: React.ReactNode;
}

export const AuthenticatedProviders = ({
  children,
}: AuthenticatedProvidersProps) => (
  <ReleasePlaybackProvider>
    <PlaybackReleaseClickProvider>
      <CrateProvider>
        <CollectionDataSync />
        {children}
        <GlobalPlaybackDock />
      </CrateProvider>
    </PlaybackReleaseClickProvider>
  </ReleasePlaybackProvider>
);
