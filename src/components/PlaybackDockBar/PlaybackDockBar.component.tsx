"use client";

import classNames from "classnames";
import { ReleaseMiniPlayer } from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.component";
import {
  useHasReleasePlaybackProvider,
  useIsMiniPlayerVisible,
} from "src/context/releasePlayback.context";
import { usePlaybackReleaseClickWithDismiss } from "src/hooks/usePlaybackReleaseClickWithDismiss.hook";
import "src/styles/global/playback-dock.css";
import playbackDockStyles from "src/styles/modules/playback-dock.module.css";
import styles from "./PlaybackDockBar.module.css";

interface PlaybackDockBarProps {
  inFlow?: boolean;
}

export const PlaybackDockBar = ({ inFlow = false }: PlaybackDockBarProps) => {
  const hasPlaybackProvider = useHasReleasePlaybackProvider();
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const onReleaseClick = usePlaybackReleaseClickWithDismiss();

  if (!hasPlaybackProvider) {
    return null;
  }

  return (
    <div
      className={classNames(styles.dock, playbackDockStyles.dockGlobals, {
        [styles.dockInFlow]: inFlow,
      })}
      data-testid="fmdPlaybackDockBar"
      {...(isMiniPlayerVisible ? { "data-global-playback-dock": true } : {})}
      {...(inFlow ? { "data-playback-dock-in-flow": true } : {})}
    >
      <ReleaseMiniPlayer onReleaseClick={onReleaseClick} />
    </div>
  );
};
