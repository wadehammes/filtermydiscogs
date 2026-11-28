"use client";

import { useAtomValue } from "jotai";
import { createPortal } from "react-dom";
import { playbackDockMobileInScrollAtom } from "src/atoms/playbackDockUi.atoms";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";

const PlaybackDockPortal = () =>
  createPortal(<PlaybackDockBar />, document.body);

export const GlobalPlaybackDock = () => {
  const dockInScrollShell = useAtomValue(playbackDockMobileInScrollAtom);

  if (dockInScrollShell) {
    return null;
  }

  return (
    <BrowserOnly>
      <PlaybackDockPortal />
    </BrowserOnly>
  );
};
