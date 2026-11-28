"use client";

import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import styles from "./PlaybackPageShell.module.css";

export const PlaybackPageInScrollDock = () => {
  const isMiniPlayerVisible = useIsMiniPlayerVisible();

  if (!isMiniPlayerVisible) {
    return null;
  }

  return (
    <div
      className={styles.inScrollDock}
      data-testid="fmdPlaybackPageInScrollDock"
    >
      <PlaybackDockBar inFlow />
    </div>
  );
};