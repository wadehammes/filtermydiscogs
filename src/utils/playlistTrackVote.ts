import {
  HOT_PLAYLIST_TRACK_MIN_NET_SCORE,
  HOT_PLAYLIST_TRACK_MIN_UP_COUNT,
  PLAYLIST_TRACK_VOTE_DOWN,
  PLAYLIST_TRACK_VOTE_UP,
  type PlaylistTrackVoteDirection,
} from "src/constants/playlistTrackVote.constants";
import type { PlaylistTrackVoteCounts } from "src/types/playlist.types";

export const playlistTrackNetVoteScore = (
  counts: Pick<PlaylistTrackVoteCounts, "upCount" | "downCount">,
): number => counts.upCount - counts.downCount;

export const isHotPlaylistTrack = (
  counts: Pick<PlaylistTrackVoteCounts, "upCount" | "downCount">,
): boolean =>
  counts.upCount >= HOT_PLAYLIST_TRACK_MIN_UP_COUNT &&
  playlistTrackNetVoteScore(counts) >= HOT_PLAYLIST_TRACK_MIN_NET_SCORE;

export const formatPlaylistTrackVoteCountLabel = (
  counts: Pick<PlaylistTrackVoteCounts, "upCount" | "downCount">,
): string | null => {
  const net = playlistTrackNetVoteScore(counts);

  if (net <= 0) {
    return null;
  }

  return String(net);
};

export const resolvePlaylistTrackVoteToggle = (
  requested: PlaylistTrackVoteDirection,
  current: PlaylistTrackVoteDirection | null | undefined,
): PlaylistTrackVoteDirection | null => {
  if (current === requested) {
    return null;
  }

  return requested;
};

export const computePlaylistTrackVoteOptimisticState = (
  track: Pick<PlaylistTrackVoteCounts, "upCount" | "downCount"> & {
    viewerVote?: PlaylistTrackVoteDirection | null;
  },
  requestedVote: PlaylistTrackVoteDirection,
): PlaylistTrackVoteCounts & {
  viewerVote: PlaylistTrackVoteDirection | null;
} => {
  const previousVote = track.viewerVote ?? null;
  const nextVote = resolvePlaylistTrackVoteToggle(requestedVote, previousVote);

  let upCount = track.upCount;
  let downCount = track.downCount;

  if (previousVote === PLAYLIST_TRACK_VOTE_UP) {
    upCount -= 1;
  } else if (previousVote === PLAYLIST_TRACK_VOTE_DOWN) {
    downCount -= 1;
  }

  if (nextVote === PLAYLIST_TRACK_VOTE_UP) {
    upCount += 1;
  } else if (nextVote === PLAYLIST_TRACK_VOTE_DOWN) {
    downCount += 1;
  }

  return {
    upCount,
    downCount,
    viewerVote: nextVote,
  };
};

export const computePlaylistTrackVoteCountIncrements = (
  track: Pick<PlaylistTrackVoteCounts, "upCount" | "downCount"> & {
    viewerVote?: PlaylistTrackVoteDirection | null;
  },
  requestedVote: PlaylistTrackVoteDirection,
): { upIncrement: number; downIncrement: number } => {
  const before = {
    upCount: track.upCount,
    downCount: track.downCount,
    viewerVote: track.viewerVote ?? null,
  };
  const after = computePlaylistTrackVoteOptimisticState(before, requestedVote);

  return {
    upIncrement: after.upCount - before.upCount,
    downIncrement: after.downCount - before.downCount,
  };
};
