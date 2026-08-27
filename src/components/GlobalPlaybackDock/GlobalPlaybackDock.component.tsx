"use client";

import classNames from "classnames";
import { ReleaseMiniPlayer } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component";
import { usePlaybackReleaseClickHandler } from "src/context/playbackReleaseClick.context";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import playbackDockStyles from "src/styles/modules/playback-dock.module.css";
import styles from "./GlobalPlaybackDock.module.css";

export const GlobalPlaybackDock = () => {
  const { isMiniPlayerVisible } = useReleasePlayback();
  const onReleaseClick = usePlaybackReleaseClickHandler();

  return (
    <div
      className={classNames(styles.dock, playbackDockStyles.dockGlobals)}
      {...(isMiniPlayerVisible ? { "data-global-playback-dock": true } : {})}
    >
      <ReleaseMiniPlayer onReleaseClick={onReleaseClick} />
    </div>
  );
};
