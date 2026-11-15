"use client";

import { Popover } from "@base-ui/react/popover";
import classNames from "classnames";
import { useCallback, useEffect, useState } from "react";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { PlaybackDockSlider } from "src/components/PlaybackDockSlider/PlaybackDockSlider.component";
import miniPlayerStyles from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.module.css";
import {
  useReleasePlaybackActions,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import VolumeMuteIcon from "src/styles/icons/volume-mute-thin.svg";
import VolumeIcon from "src/styles/icons/volume-thin.svg";
import { readPlaybackDockVolume } from "src/utils/playbackDockVolumeStorage";
import styles from "./ReleaseMiniPlayerDigControls.module.css";

interface ReleaseMiniPlayerVolumePopoverProps {
  disabled?: boolean | undefined;
}

export const ReleaseMiniPlayerVolumePopover = ({
  disabled = false,
}: ReleaseMiniPlayerVolumePopoverProps) => {
  "use memo";
  const { isPlaybackDockMuted } = useReleasePlaybackState();
  const { setPlaybackVolume, togglePlaybackMute } = useReleasePlaybackActions();
  const [open, setOpen] = useState(false);
  const [volume, setVolume] = useState(() => readPlaybackDockVolume());

  useEffect(() => {
    if (!isPlaybackDockMuted) {
      setVolume(readPlaybackDockVolume());
    }
  }, [isPlaybackDockMuted]);

  const handleVolumeCommitted = useCallback(
    (value: number) => {
      setVolume(value);
      setPlaybackVolume(value);
    },
    [setPlaybackVolume],
  );

  const handleMuteToggle = useCallback(() => {
    togglePlaybackMute();
  }, [togglePlaybackMute]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
      <Popover.Trigger
        disabled={disabled}
        render={
          <IconButton
            className={classNames(
              miniPlayerStyles.controlButton,
              styles.volumeTrigger,
              { [styles.volumeTriggerActive]: open },
            )}
            iconClassName={styles.volumeIcon}
            aria-label="Playback volume"
            title="Volume"
          >
            {isPlaybackDockMuted ? <VolumeMuteIcon /> : <VolumeIcon />}
          </IconButton>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          align="center"
          className={styles.volumePositioner}
          side="top"
          sideOffset={10}
        >
          <Popover.Popup
            className={styles.volumePopover}
            data-testid="fmdReleaseMiniPlayerVolumePopover"
          >
            <PlaybackDockSlider
              ariaLabel="Playback volume"
              className={styles.volumeSliderVertical}
              disabled={disabled}
              max={100}
              min={0}
              onValueChange={setVolume}
              onValueCommitted={handleVolumeCommitted}
              orientation="vertical"
              step={1}
              testId="fmdPlaybackDockVolumeSlider"
              value={isPlaybackDockMuted ? 0 : volume}
            />
            <button
              type="button"
              className={styles.volumeMuteAction}
              disabled={disabled}
              onClick={handleMuteToggle}
            >
              {isPlaybackDockMuted ? "Unmute" : "Mute"}
            </button>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
