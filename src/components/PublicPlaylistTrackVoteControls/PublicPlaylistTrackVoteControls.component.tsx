"use client";

import classNames from "classnames";
import {
  PLAYLIST_TRACK_VOTE_DOWN,
  PLAYLIST_TRACK_VOTE_UP,
} from "src/constants/playlistTrackVote.constants";
import { usePublicPlaylistTrackVoteMutation } from "src/hooks/mutations/usePublicPlaylistTrackVoteMutation";
import ThumbsDownIcon from "src/styles/icons/thumbs-down-thin.svg";
import ThumbsUpIcon from "src/styles/icons/thumbs-up-thin.svg";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";
import { formatPlaylistTrackVoteCountLabel } from "src/utils/playlistTrackVote";
import styles from "./PublicPlaylistTrackVoteControls.module.css";

export interface PublicPlaylistTrackVoteControlsProps {
  playlistId: string;
  track: PlaylistTrackRow;
  ownerUserId?: number | null;
}

export const PublicPlaylistTrackVoteControls = ({
  playlistId,
  track,
  ownerUserId,
}: PublicPlaylistTrackVoteControlsProps) => {
  const voteMutation = usePublicPlaylistTrackVoteMutation();
  const isPending =
    voteMutation.isPending &&
    voteMutation.variables?.track_key === track.track_key;

  const handleVote = (
    vote: typeof PLAYLIST_TRACK_VOTE_UP | typeof PLAYLIST_TRACK_VOTE_DOWN,
  ) => {
    voteMutation.mutate({
      playlistId,
      track_key: track.track_key,
      vote,
      priorViewerVote: track.viewerVote ?? null,
      ...definedProps({ ownerUserId }),
    });
  };

  const voteCountLabel = formatPlaylistTrackVoteCountLabel(track);

  return (
    <div
      className={styles.root}
      data-testid="fmdPublicPlaylistTrackVoteControls"
    >
      <span className={styles.voteUpWrap}>
        <button
          type="button"
          className={classNames(styles.voteButton, {
            [styles.voteButtonUpPressed]:
              track.viewerVote === PLAYLIST_TRACK_VOTE_UP,
          })}
          disabled={isPending}
          aria-label={`Thumbs up ${track.track_title}`}
          aria-pressed={track.viewerVote === PLAYLIST_TRACK_VOTE_UP}
          onClick={() => handleVote(PLAYLIST_TRACK_VOTE_UP)}
        >
          <ThumbsUpIcon aria-hidden />
        </button>
        {voteCountLabel ? (
          <>
            <sup className={styles.voteCountSup}>{voteCountLabel}</sup>
            <span className={accessibilityStyles.visuallyHidden}>
              {voteCountLabel} net up votes
            </span>
          </>
        ) : null}
      </span>
      <button
        type="button"
        className={classNames(styles.voteButton, {
          [styles.voteButtonDownPressed]:
            track.viewerVote === PLAYLIST_TRACK_VOTE_DOWN,
        })}
        disabled={isPending}
        aria-label={`Thumbs down ${track.track_title}`}
        aria-pressed={track.viewerVote === PLAYLIST_TRACK_VOTE_DOWN}
        onClick={() => handleVote(PLAYLIST_TRACK_VOTE_DOWN)}
      >
        <ThumbsDownIcon aria-hidden />
      </button>
    </div>
  );
};
