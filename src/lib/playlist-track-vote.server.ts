import {
  PLAYLIST_TRACK_VOTE_DOWN,
  PLAYLIST_TRACK_VOTE_UP,
} from "src/constants/playlistTrackVote.constants";
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
  voterKeys: string[] | null,
): Promise<PlaylistTrackRow[]> => {
  if (!voterKeys?.length || tracks.length === 0) {
    return tracks;
  }

  const votes = await listViewerVotesForPlaylist(
    ownerUserId,
    playlistId,
    voterKeys,
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
  voterKeys: string[],
  trackKeys: string[],
): Promise<Map<string, PlaylistTrackVoteDirection>> => {
  if (trackKeys.length === 0) {
    return new Map();
  }

  const rows = await prisma.playlistTrackVote.findMany({
    where: {
      user_id: ownerUserId,
      playlist_id: playlistId,
      voter_key: { in: voterKeys },
      track_key: { in: trackKeys },
    },
    select: { track_key: true, vote: true, voter_key: true },
  });

  const votes = new Map<string, PlaylistTrackVoteDirection>();

  for (const row of rows) {
    const vote = row.vote as PlaylistTrackVoteDirection;
    const existing = votes.get(row.track_key);

    if (!existing || row.voter_key.startsWith("user:")) {
      votes.set(row.track_key, vote);
    }
  }

  return votes;
};

export const mergeAnonymousPlaylistVoterVotes = async (
  ownerUserId: number,
  playlistId: string,
  viewerUserId: number,
  anonymousVoterId: string,
): Promise<void> => {
  const trimmedAnon = anonymousVoterId.trim();

  if (!trimmedAnon) {
    return;
  }

  const anonKey = `anon:${trimmedAnon}`;
  const userKey = `user:${viewerUserId}`;

  await prisma.$transaction(async (tx) => {
    const anonVotes = await tx.playlistTrackVote.findMany({
      where: {
        user_id: ownerUserId,
        playlist_id: playlistId,
        voter_key: anonKey,
      },
      select: { track_key: true, vote: true },
    });

    if (anonVotes.length === 0) {
      return;
    }

    const userVotes = await tx.playlistTrackVote.findMany({
      where: {
        user_id: ownerUserId,
        playlist_id: playlistId,
        voter_key: userKey,
        track_key: { in: anonVotes.map((vote) => vote.track_key) },
      },
      select: { track_key: true },
    });
    const userVoteTracks = new Set(userVotes.map((vote) => vote.track_key));

    for (const anonVote of anonVotes) {
      if (!userVoteTracks.has(anonVote.track_key)) {
        await tx.playlistTrackVote.update({
          where: {
            user_id_playlist_id_track_key_voter_key: {
              user_id: ownerUserId,
              playlist_id: playlistId,
              track_key: anonVote.track_key,
              voter_key: anonKey,
            },
          },
          data: { voter_key: userKey },
        });
        continue;
      }

      await tx.playlistTrackVote.delete({
        where: {
          user_id_playlist_id_track_key_voter_key: {
            user_id: ownerUserId,
            playlist_id: playlistId,
            track_key: anonVote.track_key,
            voter_key: anonKey,
          },
        },
      });

      const countDelta: {
        up_count?: { decrement: number };
        down_count?: { decrement: number };
      } = {};

      if (anonVote.vote === PLAYLIST_TRACK_VOTE_UP) {
        countDelta.up_count = { decrement: 1 };
      } else if (anonVote.vote === PLAYLIST_TRACK_VOTE_DOWN) {
        countDelta.down_count = { decrement: 1 };
      }

      if (Object.keys(countDelta).length > 0) {
        await tx.playlistTrack.update({
          where: {
            user_id_playlist_id_track_key: {
              user_id: ownerUserId,
              playlist_id: playlistId,
              track_key: anonVote.track_key,
            },
          },
          data: countDelta,
        });
      }
    }
  });
};

export type RecordPublicPlaylistTrackVoteInput = {
  playlistId: string;
  trackKey: string;
  requestedVote: PlaylistTrackVoteDirection;
  voterKey: string;
  viewerUserId?: number | null;
  anonymousVoterId?: string | null;
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

  if (input.viewerUserId != null && input.anonymousVoterId?.trim()) {
    await mergeAnonymousPlaylistVoterVotes(
      playlist.user_id,
      playlist.id,
      input.viewerUserId,
      input.anonymousVoterId,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const trackRowInTx = await tx.playlistTrack.findUnique({
      where: {
        user_id_playlist_id_track_key: {
          user_id: playlist.user_id,
          playlist_id: playlist.id,
          track_key: input.trackKey,
        },
      },
      select: { up_count: true, down_count: true },
    });

    if (!trackRowInTx) {
      return null;
    }

    const existing = await tx.playlistTrackVote.findUnique({
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

    const countsBefore = mapPlaylistTrackVoteCounts(trackRowInTx);
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

    const updatedTrack =
      Object.keys(countDelta).length > 0
        ? await tx.playlistTrack.update({
            where: {
              user_id_playlist_id_track_key: {
                user_id: playlist.user_id,
                playlist_id: playlist.id,
                track_key: input.trackKey,
              },
            },
            data: countDelta,
            select: { up_count: true, down_count: true },
          })
        : trackRowInTx;

    return {
      counts: updatedTrack,
      viewerVote: nextVote,
    };
  });

  if (!updated) {
    return null;
  }

  return {
    track_key: input.trackKey,
    ...mapPlaylistTrackVoteCounts(updated.counts),
    viewerVote: updated.viewerVote,
  };
};
