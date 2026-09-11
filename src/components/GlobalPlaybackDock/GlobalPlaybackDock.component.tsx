"use client";

import { createPortal } from "react-dom";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";

export const GlobalPlaybackDock = () => {
  return (
    <BrowserOnly>
      {createPortal(<PlaybackDockBar />, document.body)}
    </BrowserOnly>
  );
};
