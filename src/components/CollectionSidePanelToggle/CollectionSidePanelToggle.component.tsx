"use client";

import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import type { CollectionSidePanelMode } from "src/hooks/useCrateDrawer.hook";
import CratesIcon from "src/styles/icons/crates-thin.svg";
import { PlaylistThinIcon } from "src/styles/icons/PlaylistThinIcon.component";
import styles from "./CollectionSidePanelToggle.module.css";

export interface CollectionSidePanelToggleProps {
  sidePanel: CollectionSidePanelMode;
  isDrawerOpen: boolean;
  onSelectSidePanel: (panel: CollectionSidePanelMode) => void;
  playlistsEnabled?: boolean;
  deferSegmentHighlight?: boolean;
  className?: string;
}

export const CollectionSidePanelToggle = ({
  sidePanel,
  isDrawerOpen,
  onSelectSidePanel,
  playlistsEnabled = true,
  deferSegmentHighlight = false,
  className,
}: CollectionSidePanelToggleProps) => {
  const highlightActive = isDrawerOpen && !deferSegmentHighlight;
  const cratesActive = highlightActive && sidePanel === "crates";
  const playlistsActive = highlightActive && sidePanel === "playlists";

  return (
    <div
      className={classNames(styles.wrapper, className)}
      data-testid="fmdCollectionSidePanelToggle"
    >
      <SegmentedControl legend="Crates and playlists">
        <IconButton
          className={classNames(segmentedStyles.segment, {
            [segmentedStyles.active]: cratesActive,
          })}
          iconClassName={styles.segmentIcon}
          label="Crates"
          onClick={() => {
            onSelectSidePanel("crates");
          }}
          aria-label={cratesActive ? "Close crates panel" : "Open crates panel"}
          title={cratesActive ? "Close crates" : "Crates"}
          aria-pressed={cratesActive}
        >
          <CratesIcon />
        </IconButton>
        {playlistsEnabled ? (
          <IconButton
            className={classNames(segmentedStyles.segment, {
              [segmentedStyles.active]: playlistsActive,
            })}
            iconClassName={styles.segmentIcon}
            label="Playlists"
            onClick={() => {
              onSelectSidePanel("playlists");
            }}
            aria-label={
              playlistsActive ? "Close playlists panel" : "Open playlists panel"
            }
            title={playlistsActive ? "Close playlists" : "Playlists"}
            aria-pressed={playlistsActive}
          >
            <PlaylistThinIcon />
          </IconButton>
        ) : null}
      </SegmentedControl>
    </div>
  );
};
