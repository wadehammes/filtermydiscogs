"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PLAYLIST_PUBLIC_TRACK_VOTE_STATS_TOOLTIP } from "src/constants/playlistTrackVote.constants";
import type { PlaylistDrawerStatEntry } from "src/utils/playlistDrawerStats";
import styles from "./PlaylistDrawerStats.module.css";

export interface PlaylistDrawerStatsProps {
  entries: PlaylistDrawerStatEntry[];
}

export const PlaylistDrawerStats = ({ entries }: PlaylistDrawerStatsProps) => {
  const { statsPanelOpen } = usePlaylistDrawerContext();

  if (!statsPanelOpen || entries.length === 0) {
    return null;
  }

  return (
    <Tooltip.Provider closeDelay={80} delay={250}>
      <section
        id="fmdPlaylistDrawerStatsPanel"
        className={styles.root}
        aria-label="Playlist stats"
        data-testid="fmdPlaylistDrawerStats"
      >
        <dl className={styles.statList}>
          {entries.map((entry) => (
            <div key={entry.id} className={styles.statItem}>
              <dt className={styles.statLabel}>
                {entry.id === "upvotes" || entry.id === "downvotes" ? (
                  <Tooltip.Root>
                    <Tooltip.Trigger className={styles.statLabelTrigger}>
                      {entry.label}
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Positioner
                        align="center"
                        className={styles.tooltipPositioner}
                        side="top"
                      >
                        <Tooltip.Popup className={styles.tooltipPopup}>
                          {PLAYLIST_PUBLIC_TRACK_VOTE_STATS_TOOLTIP}
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ) : (
                  entry.label
                )}
              </dt>
              <dd className={styles.statValue}>{entry.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </Tooltip.Provider>
  );
};
