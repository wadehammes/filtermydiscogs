export const PLAYLIST_TRACK_VOTE_UP = 1 as const;
export const PLAYLIST_TRACK_VOTE_DOWN = -1 as const;

export type PlaylistTrackVoteDirection =
  | typeof PLAYLIST_TRACK_VOTE_UP
  | typeof PLAYLIST_TRACK_VOTE_DOWN;

export const PUBLIC_PLAYLIST_VOTER_COOKIE_NAME = "fmd_plvv";

export const PUBLIC_PLAYLIST_VOTER_COOKIE_MAX_AGE_SEC = 365 * 24 * 60 * 60;

export const PLAYLIST_PUBLIC_TRACK_VOTE_STATS_TOOLTIP =
  "Listener votes on your public playlist: thumbs up and thumbs down totals for this track.";

export const HOT_PLAYLIST_TRACK_MIN_UP_COUNT = 3;

export const HOT_PLAYLIST_TRACK_MIN_NET_SCORE = 2;
