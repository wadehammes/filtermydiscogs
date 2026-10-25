"use client";

import type { ReactNode } from "react";
import { GlobalPlaybackDock } from "src/components/GlobalPlaybackDock/GlobalPlaybackDock.component";
import { PlaybackSkipHelpDialogHost } from "src/components/PlaybackSkipHelpDialog/PlaybackSkipHelpDialog.component";
import { PlaybackSkipReportDialogHost } from "src/components/PlaybackSkipReportDialog/PlaybackSkipReportDialog.component";
import { useAuth } from "src/context/auth.context";
import {
  ReleasePlaybackProvider,
  useHasReleasePlaybackProvider,
} from "src/context/releasePlayback.context";

interface PlaybackProvidersShellProps {
  children: ReactNode;
}

export const PlaybackProvidersShell = ({
  children,
}: PlaybackProvidersShellProps) => (
  <ReleasePlaybackProvider>
    {children}
    <GlobalPlaybackDock />
    <PlaybackSkipHelpDialogHost />
    <PlaybackSkipReportDialogHost />
  </ReleasePlaybackProvider>
);

interface EnsurePlaybackProvidersShellProps {
  children: ReactNode;
}

export const EnsurePlaybackProvidersShell = ({
  children,
}: EnsurePlaybackProvidersShellProps) => {
  const hasProvider = useHasReleasePlaybackProvider();
  const {
    state: { isCheckingAuth },
  } = useAuth();

  if (hasProvider || isCheckingAuth) {
    return children;
  }

  return <PlaybackProvidersShell>{children}</PlaybackProvidersShell>;
};
