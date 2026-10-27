import { prisma } from "src/lib/db";
import { isPublicPlaylistOwnerViewer } from "src/lib/playlist-public-viewer.server";
import { findPublicPlaylistById } from "src/lib/public-playlist-query.server";
import type {
  PlaylistTrackRow,
  PlaylistTrackVoteDirection,
} from "src/types/playlist.types";
import {
  computePlaylistTrackVoteCountIncrements,
  resolvePlaylistTrackVoteToggle,
} from "src/utils/playlistTrackVote";

export type PlaylistTrackVoteCountsRow = {
  upCount: number;
  downCount: number;
};

export const mapPlaylistTrackVoteCounts = (row: {
  up_count: number;
  down_count: number;
}): PlaylistTrackVoteCountsRow => ({
  upCount: row.up_count,
  downCount: row.down_count,
});

export const attachViewerVotesToPlaylistTracks = async (
  ownerUserId: number,
  playlistId: string,
  tracks: PlaylistTrackRow[],
  voterKey: string | null,
): Promise<PlaylistTrackRow[]> => {
  if (!voterKey || tracks.length === 0) {
    return tracks;
  }

  const votes = await listViewerVotesForPlaylist(
    ownerUserId,
    playlistId,
    voterKey,
    tracks.map((track) => track.track_key),
  );

  return tracks.map((track) => ({
    ...track,
    viewerVote: votes.get(track.track_key) ?? null,
  }));
};

const listViewerVotesForPlaylist = async (
  ownerUserId: number,
  playlistId: string,
  voterKey: string,
  trackKeys: string[],
): Promise<Map<string, PlaylistTrackVoteDirection>> => {
  if (trackKeys.length === 0) {
    return new Map();
  }

  const rows = await prisma.playlistTrackVote.findMany({
    where: {
      user_id: ownerUserId,
      playlist_id: playlistId,
      voter_key: voterKey,
      track_key: { in: trackKeys },
    },
    select: { track_key: true, vote: true },
  });

  return new Map(
    rows.map((row) => [row.track_key, row.vote as PlaylistTrackVoteDirection]),
  );
};

export type RecordPublicPlaylistTrackVoteInput = {
  playlistId: string;
  trackKey: string;
  requestedVote: PlaylistTrackVoteDirection;
  voterKey: string;
  viewerUserId?: number | null;
};

export type RecordPublicPlaylistTrackVoteResult = {
  track_key: string;
  upCount: number;
  downCount: number;
  viewerVote: PlaylistTrackVoteDirection | null;
} | null;

export const recordPublicPlaylistTrackVote = async (
  input: RecordPublicPlaylistTrackVoteInput,
): Promise<RecordPublicPlaylistTrackVoteResult> => {
  const playlist = await findPublicPlaylistById(input.playlistId);

  if (!playlist) {
    return null;
  }

  const trackRow = await prisma.playlistTrack.findUnique({
    where: {
      user_id_playlist_id_track_key: {
        user_id: playlist.user_id,
        playlist_id: playlist.id,
        track_key: input.trackKey,
      },
    },
    select: { up_count: true, down_count: true },
  });

  if (!trackRow) {
    return null;
  }

  if (isPublicPlaylistOwnerViewer(playlist.user_id, input.viewerUserId)) {
    return {
      track_key: input.trackKey,
      ...mapPlaylistTrackVoteCounts(trackRow),
      viewerVote: null,
    };
  }

  const existing = await prisma.playlistTrackVote.findUnique({
    where: {
      user_id_playlist_id_track_key_voter_key: {
        user_id: playlist.user_id,
        playlist_id: playlist.id,
        track_key: input.trackKey,
        voter_key: input.voterKey,
      },
    },
    select: { vote: true },
  });

  const previousVote = (existing?.vote ??
    null) as PlaylistTrackVoteDirection | null;
  const nextVote = resolvePlaylistTrackVoteToggle(
    input.requestedVote,
    previousVote,
  );

  const countsBefore = mapPlaylistTrackVoteCounts(trackRow);
  const { upIncrement, downIncrement } =
    computePlaylistTrackVoteCountIncrements(
      { ...countsBefore, viewerVote: previousVote },
      input.requestedVote,
    );
  const countDelta: {
    up_count?: { increment: number };
    down_count?: { increment: number };
  } = {};

  if (upIncrement !== 0) {
    countDelta.up_count = { increment: upIncrement };
  }

  if (downIncrement !== 0) {
    countDelta.down_count = { increment: downIncrement };
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextVote === null && existing) {
      await tx.playlistTrackVote.delete({
        where: {
          user_id_playlist_id_track_key_voter_key: {
            user_id: playlist.user_id,
            playlist_id: playlist.id,
            track_key: input.trackKey,
            voter_key: input.voterKey,
          },
        },
      });
    } else if (nextVote !== null) {
      await tx.playlistTrackVote.upsert({
        where: {
          user_id_playlist_id_track_key_voter_key: {
            user_id: playlist.user_id,
            playlist_id: playlist.id,
            track_key: input.trackKey,
            voter_key: input.voterKey,
          },
        },
        create: {
          user_id: playlist.user_id,
          playlist_id: playlist.id,
          track_key: input.trackKey,
          voter_key: input.voterKey,
          vote: nextVote,
        },
        update: { vote: nextVote },
      });
    }

    if (Object.keys(countDelta).length > 0) {
      return tx.playlistTrack.update({
        where: {
          user_id_playlist_id_track_key: {
            user_id: playlist.user_id,
            playlist_id: playlist.id,
            track_key: input.trackKey,
          },
        },
        data: countDelta,
        select: { up_count: true, down_count: true },
      });
    }

    return trackRow;
  });

  return {
    track_key: input.trackKey,
    ...mapPlaylistTrackVoteCounts(updated),
    viewerVote: nextVote,
  };
};
