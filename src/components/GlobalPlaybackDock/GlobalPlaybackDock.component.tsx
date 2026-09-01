"use client";

import { createPortal } from "react-dom";
import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";
import { useMounted } from "src/hooks/useMounted.hook";

export const GlobalPlaybackDock = () => {
  const mounted = useMounted();

  if (!mounted) {
    return null;
  }

  return createPortal(<PlaybackDockBar />, document.body);
};
