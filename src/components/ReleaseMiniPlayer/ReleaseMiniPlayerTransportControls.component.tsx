"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import {
  TransportSkipNextIcon,
  TransportSkipPreviousIcon,
} from "src/components/TransportSkipIcons/TransportSkipIcons.component";
import { ListThinIcon } from "src/styles/icons/ListThinIcon.component";
import PauseIcon from "src/styles/icons/pause-thin.svg";
import PlayIcon from "src/styles/icons/play-thin.svg";
import VideoIcon from "src/styles/icons/video-thin.svg";
import styles from "./ReleaseMiniPlayer.module.css";

interface ReleaseMiniPlayerTransportControlsProps {
  isMobileLayout: boolean;
  crateToggleButton: ReactNode;
  isQueueOpen: boolean;
  queueButtonAriaLabel: string;
  queueButtonAddon?: ReactNode;
  onQueueToggle: () => void;
  isPlaybackReady: boolean;
  isVideoPanelExpanded: boolean;
  onVideoToggle: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  isPaused: boolean;
  onPlayPrevious: () => void;
  onTogglePlayback: () => void;
  onPlayNext: () => void;
}

export const ReleaseMiniPlayerTransportControls = ({
  isMobileLayout,
  crateToggleButton,
  isQueueOpen,
  queueButtonAriaLabel,
  queueButtonAddon,
  onQueueToggle,
  isPlaybackReady,
  isVideoPanelExpanded,
  onVideoToggle,
  hasPrevious,
  hasNext,
  isPaused,
  onPlayPrevious,
  onTogglePlayback,
  onPlayNext,
}: ReleaseMiniPlayerTransportControlsProps) => (
  <div className={styles.controls}>
    {isMobileLayout ? crateToggleButton : null}
    <IconButton
      variant="queue"
      className={classNames(styles.controlButton, styles.queueButton, {
        [styles.queueButtonActive]: isQueueOpen,
      })}
      iconClassName={styles.controlIcon}
      addon={queueButtonAddon}
      onClick={onQueueToggle}
      aria-expanded={isQueueOpen}
      aria-label={queueButtonAriaLabel}
      title="Playback queue"
    >
      <ListThinIcon />
    </IconButton>
    {isPlaybackReady ? (
      <IconButton
        className={classNames(styles.controlButton, {
          [styles.videoButtonActive]: isVideoPanelExpanded,
        })}
        iconClassName={styles.controlIcon}
        onClick={onVideoToggle}
        aria-expanded={isVideoPanelExpanded}
        aria-controls="release-playback-video-panel"
        aria-label={isVideoPanelExpanded ? "Hide video" : "Show video"}
        title={isVideoPanelExpanded ? "Hide video" : "Show video"}
      >
        <VideoIcon />
      </IconButton>
    ) : null}
    <IconButton
      className={styles.controlButton}
      iconClassName={styles.controlIcon}
      onClick={onPlayPrevious}
      disabled={!hasPrevious}
      aria-label="Previous track"
      title="Previous track"
    >
      <TransportSkipPreviousIcon />
    </IconButton>
    <IconButton
      className={styles.controlButton}
      iconClassName={styles.controlIcon}
      onClick={onTogglePlayback}
      disabled={!isPlaybackReady}
      aria-label={isPaused ? "Play" : "Pause"}
      title={isPaused ? "Play" : "Pause"}
    >
      {isPaused ? <PlayIcon /> : <PauseIcon />}
    </IconButton>
    <IconButton
      className={styles.controlButton}
      iconClassName={styles.controlIcon}
      onClick={onPlayNext}
      disabled={!hasNext}
      aria-label="Next track"
      title="Next track"
    >
      <TransportSkipNextIcon />
    </IconButton>
  </div>
);
