"use client";

import classNames from "classnames";
import { usePlaybackReleaseClickHandler } from "src/context/playbackReleaseClick.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import playbackDockStyles from "src/styles/playback-dock.module.css";
import styles from "./GlobalPlaybackDock.module.css";
import { ReleaseMiniPlayer } from "./ReleaseMiniPlayer.component";

export const GlobalPlaybackDock = () => {
  const { isPlaying } = useReleasePlayback();
  const onReleaseClick = usePlaybackReleaseClickHandler();

  return (
    <div
      className={classNames(styles.dock, playbackDockStyles.dockGlobals)}
      {...(isPlaying ? { "data-global-playback-dock": true } : {})}
    >
      <ReleaseMiniPlayer onReleaseClick={onReleaseClick} />
    </div>
  );
};
