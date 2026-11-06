"use client";

import classNames from "classnames";
import Link from "next/link";
import { memo } from "react";
import Button from "src/components/Button/Button.component";
import buttonStyles from "src/components/Button/Button.module.css";
import playlistStyles from "src/components/PublicPlaylist/PublicPlaylist.module.css";
import heroStyles from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.module.css";
import PlayIcon from "src/styles/icons/play-thin.svg";

export interface PublicReleaseHeroActionsProps {
  discogsUri: string;
  onPlayAll: () => void;
  trackCount: number;
}

export const PublicReleaseHeroActions = memo(
  ({ discogsUri, onPlayAll, trackCount }: PublicReleaseHeroActionsProps) => (
    <div className={heroStyles.releaseHeroActionRow}>
      <Button
        variant="primary"
        size="md"
        className={playlistStyles.playButton}
        onPress={onPlayAll}
        disabled={trackCount === 0}
      >
        <span className={playlistStyles.playButtonIcon} aria-hidden>
          <PlayIcon />
        </span>
        Play All
      </Button>
      {discogsUri ? (
        <Link
          href={discogsUri}
          className={classNames(
            buttonStyles.button,
            buttonStyles.secondary,
            buttonStyles.md,
            playlistStyles.playButton,
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Discogs
        </Link>
      ) : null}
    </div>
  ),
);

PublicReleaseHeroActions.displayName = "PublicReleaseHeroActions";
