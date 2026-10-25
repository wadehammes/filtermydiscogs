"use client";

import type { ReactNode } from "react";
import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import { useHasReleasePlaybackProvider } from "src/context/releasePlayback.context";

interface PublicSharePlaybackShellProps {
  children: ReactNode;
}

export const PublicSharePlaybackShell = ({
  children,
}: PublicSharePlaybackShellProps) => {
  const hasProvider = useHasReleasePlaybackProvider();
  const content = (
    <div data-testid="fmdPublicSharePlaybackShell">{children}</div>
  );

  if (hasProvider) {
    return content;
  }

  return <PlaybackProvidersShell>{content}</PlaybackProvidersShell>;
};
