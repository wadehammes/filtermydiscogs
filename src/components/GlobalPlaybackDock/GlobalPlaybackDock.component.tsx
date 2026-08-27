"use client";

import classNames from "classnames";
import { createPortal } from "react-dom";
import { ReleaseMiniPlayer } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component";
import { usePlaybackReleaseClickHandler } from "src/context/playbackReleaseClick.context";
import { useIsMiniPlayerVisible } from "src/context/releasePlayback.context";
import { useMounted } from "src/hooks/useMounted.hook";
import playbackDockStyles from "src/styles/modules/playback-dock.module.css";
import styles from "./GlobalPlaybackDock.module.css";

export const GlobalPlaybackDock = () => {
  const mounted = useMounted();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const onReleaseClick = usePlaybackReleaseClickHandler();

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={classNames(styles.dock, playbackDockStyles.dockGlobals)}
      {...(isMiniPlayerVisible ? { "data-global-playback-dock": true } : {})}
    >
      <ReleaseMiniPlayer onReleaseClick={onReleaseClick} />
    </div>,
    document.body,
  );
};
