"use client";

import {
  useHasReleasePlaybackProvider,
  useIsMiniPlayerVisible,
  useReleasePlaybackActions,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import { usePlaybackDockMobileBarCollapsed } from "src/hooks/usePlaybackDockMobileBarCollapsed.hook";
import { PlaybackDockBarPanelThinIcon } from "src/styles/icons/PlaybackDockBarPanelThinIcon.component";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import styles from "./MobilePlaybackHeaderControl.module.css";

const MobilePlaybackHeaderControlInner = () => {
  const isMiniPlayerVisible = useIsMiniPlayerVisible();
  const {
    collapseDockBar,
    expandDockBar,
    isDockBarCollapsed,
    isMobilePlaybackDockUiActive,
  } = usePlaybackDockMobileBarCollapsed({
    isMiniPlayerVisible,
  });
  const { isPaused, isPlaybackReady } = useReleasePlaybackState();
  const { togglePlayback } = useReleasePlaybackActions();

  if (!isMobilePlaybackDockUiActive) {
    return null;
  }

  const playPauseLabel = isPaused ? "Play" : "Pause";
  const dockToggleLabel = isDockBarCollapsed
    ? "Show playback bar"
    : "Hide playback bar";

  return (
    <div
      className={styles.headerPlayback}
      data-testid="fmdMobilePlaybackHeaderControl"
    >
      {isDockBarCollapsed ? (
        <button
          type="button"
          className={styles.headerButton}
          data-testid="fmdMobilePlaybackHeaderPlayPause"
          onClick={togglePlayback}
          disabled={!isPlaybackReady}
          aria-label={playPauseLabel}
          title={playPauseLabel}
        >
          <span className={styles.headerIcon} aria-hidden>
            {isPaused ? <PlayIcon /> : <PauseIcon />}
          </span>
        </button>
      ) : null}
      <button
        type="button"
        className={styles.headerButton}
        data-testid="fmdMobilePlaybackHeaderDockToggle"
        onClick={isDockBarCollapsed ? expandDockBar : collapseDockBar}
        aria-expanded={!isDockBarCollapsed}
        aria-label={dockToggleLabel}
        title={dockToggleLabel}
      >
        <span className={styles.headerIcon} aria-hidden>
          <PlaybackDockBarPanelThinIcon dockBarSolid={!isDockBarCollapsed} />
        </span>
      </button>
    </div>
  );
};

export const MobilePlaybackHeaderControl = () => {
  const hasPlaybackProvider = useHasReleasePlaybackProvider();

  if (!hasPlaybackProvider) {
    return null;
  }

  return <MobilePlaybackHeaderControlInner />;
};
