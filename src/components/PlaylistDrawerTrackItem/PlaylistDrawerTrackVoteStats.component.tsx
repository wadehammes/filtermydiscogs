"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { PLAYLIST_PUBLIC_TRACK_VOTE_STATS_TOOLTIP } from "src/constants/playlistTrackVote.constants";
import ThumbsDownIcon from "src/styles/icons/thumbs-down-thin.svg";
import ThumbsUpIcon from "src/styles/icons/thumbs-up-thin.svg";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import styles from "./PlaylistDrawerTrackVoteStats.module.css";

export interface PlaylistDrawerTrackVoteStatsProps {
  track: Pick<PlaylistTrackRow, "upCount" | "downCount">;
}

export const PlaylistDrawerTrackVoteStats = ({
  track,
}: PlaylistDrawerTrackVoteStatsProps) => (
  <Tooltip.Provider closeDelay={80} delay={250}>
    <Tooltip.Root>
      <Tooltip.Trigger
        className={styles.trigger}
        data-testid="fmdPlaylistDrawerTrackVoteStats"
      >
        <span className={styles.voteStat} aria-hidden>
          <ThumbsUpIcon aria-hidden />
          <span className={styles.voteStatCount}>{track.upCount}</span>
        </span>
        <span className={styles.voteStat} aria-hidden>
          <ThumbsDownIcon aria-hidden />
          <span className={styles.voteStatCount}>{track.downCount}</span>
        </span>
        <span className={accessibilityStyles.visuallyHidden}>
          {track.upCount} up votes, {track.downCount} down votes
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner
          align="end"
          className={styles.positioner}
          side="top"
        >
          <Tooltip.Popup className={styles.popup}>
            {PLAYLIST_PUBLIC_TRACK_VOTE_STATS_TOOLTIP}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);
