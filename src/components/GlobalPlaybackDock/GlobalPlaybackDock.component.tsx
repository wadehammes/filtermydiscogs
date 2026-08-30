"use client";

import { createPortal } from "react-dom";
import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";
import { usePlaybackShellHandlesDock } from "src/components/PlaybackPageShell/PlaybackShellRegistry.context";
import { useMounted } from "src/hooks/useMounted.hook";

export const GlobalPlaybackDock = () => {
  const mounted = useMounted();
  const shellHandlesDock = usePlaybackShellHandlesDock();

  if (!mounted || shellHandlesDock) {
    return null;
  }

  return createPortal(<PlaybackDockBar />, document.body);
};
