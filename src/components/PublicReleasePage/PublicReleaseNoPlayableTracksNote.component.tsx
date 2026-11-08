"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import classNames from "classnames";
import playlistStyles from "src/components/PublicPlaylist/PublicPlaylist.module.css";
import {
  PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_ARIA_LABEL,
  PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_TOOLTIP,
  PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_NOTE,
} from "src/constants/publicReleaseListen.constants";
import InfoCircleThinIcon from "src/styles/icons/info-circle-thin.svg";
import styles from "./PublicReleaseNoPlayableTracksNote.module.css";

export const PublicReleaseNoPlayableTracksNote = () => (
  <div
    className={styles.root}
    data-testid="fmdPublicReleaseNoPlayableTracksNote"
  >
    <p className={classNames(playlistStyles.text, styles.message)}>
      {PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_NOTE}
    </p>
    <Tooltip.Provider closeDelay={80} delay={250}>
      <Tooltip.Root>
        <Tooltip.Trigger
          type="button"
          className={styles.infoTrigger}
          aria-label={PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_ARIA_LABEL}
          data-testid="fmdPublicReleaseNoPlayableTracksInfo"
        >
          <InfoCircleThinIcon aria-hidden />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner
            align="start"
            className={styles.tooltipPositioner}
            side="top"
          >
            <Tooltip.Popup className={styles.tooltipPopup}>
              {PUBLIC_RELEASE_NO_PLAYABLE_TRACKS_INFO_TOOLTIP}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  </div>
);
