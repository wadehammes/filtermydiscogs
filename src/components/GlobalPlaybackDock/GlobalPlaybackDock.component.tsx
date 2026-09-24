"use client";

import { createPortal } from "react-dom";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";

const PlaybackDockPortal = () =>
  createPortal(<PlaybackDockBar />, document.body);

export const GlobalPlaybackDock = () => {
  return (
    <BrowserOnly>
      <PlaybackDockPortal />
    </BrowserOnly>
  );
};
