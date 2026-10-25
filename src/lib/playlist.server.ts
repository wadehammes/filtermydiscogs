import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "src/lib/db";
import { mapPlaylistTrackRow } from "src/lib/playlist-track-map.server";
import { ensureUserTrackMetadata } from "src/lib/user-track.server";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import type { PlaylistDetail, PlaylistSummary } from "src/types/playlist.types";

const playlistWhere = (userId: number, playlistId: string) => ({
  user_id_id: { user_id: userId, id: playlistId },
});

const playlistTrackWhere = (
  userId: number,
  playlistId: string,
  trackKey: string,
) => ({
  user_id_playlist_id_track_key: {
    user_id: userId,
    playlist_id: playlistId,
    track_key: trackKey,
  },
});

const toIso = (date: Date) => date.toISOString();

type PlaylistSummaryRow = {
  id: string;
  name: string;
  private: boolean;
  created_at: Date;
  updated_at: Date;
  _count: { tracks: number };
  tracks?: { track_key: string }[];
};

const mapPlaylistSummaryRow = (
  row: PlaylistSummaryRow,
  options?: { trackKey?: string },
): PlaylistSummary => {
  const summary: PlaylistSummary = {
    id: row.id,
    name: row.name,
    trackCount: row._count.tracks,
    private: row.private,
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  };

  if (options?.trackKey) {
    return {
      ...summary,
      containsTrack: (row.tracks?.length ?? 0) > 0,
    };
  }

  return summary;
};

export type ListPlaylistsForUserOptions = {
  trackKey?: string;
};

export const listPlaylistsForUser = async (
  userId: number,
  options?: ListPlaylistsForUserOptions,
): Promise<PlaylistSummary[]> => {
  const trackKey = options?.trackKey?.trim();

  const rows = await prisma.playlist.findMany({
    where: { user_id: userId },
    orderBy: { updated_at: "desc" },
    select: {
      id: true,
      name: true,
      private: true,
      created_at: true,
      updated_at: true,
      _count: { select: { tracks: true } },
      ...(trackKey
        ? {
            tracks: {
              where: { track_key: trackKey },
              take: 1,
              select: { track_key: true },
            },
          }
        : {}),
    },
  });

  return rows.map((row) =>
    mapPlaylistSummaryRow(row, trackKey ? { trackKey } : undefined),
  );
};

export const createPlaylist = async (
  userId: number,
  name: string,
): Promise<PlaylistSummary> => {
  const row = await prisma.playlist.create({
    data: {
      user_id: userId,
      id: randomUUID(),
      name: name.trim(),
    },
    select: {
      id: true,
      name: true,
      private: true,
      created_at: true,
      updated_at: true,
      _count: { select: { tracks: true } },
    },
  });

  return mapPlaylistSummaryRow(row);
};

export const getPlaylistDetail = async (
  userId: number,
  playlistId: string,
): Promise<PlaylistDetail | null> => {
  const playlist = await prisma.playlist.findUnique({
    where: playlistWhere(userId, playlistId),
    select: {
      id: true,
      name: true,
      private: true,
      created_at: true,
      updated_at: true,
      tracks: {
        orderBy: { sort_order: "asc" },
        select: {
          sort_order: true,
          track_key: true,
          user_track: {
            select: {
              track_title: true,
              track_position: true,
              instance_id: true,
              artist: true,
              release_title: true,
              youtube_id: true,
              discogs_release_id: true,
            },
          },
        },
      },
    },
  });

  if (!playlist) {
    return null;
  }

  return {
    id: playlist.id,
    name: playlist.name,
    private: playlist.private,
    created_at: toIso(playlist.created_at),
    updated_at: toIso(playlist.updated_at),
    tracks: playlist.tracks.map(mapPlaylistTrackRow),
  };
};

export type UpdatePlaylistFields = {
  name?: string;
  private?: boolean;
  username?: string;
};

export const updatePlaylistFields = async (
  userId: number,
  playlistId: string,
  fields: UpdatePlaylistFields,
): Promise<boolean> => {
  const data: {
    name?: string;
    private?: boolean;
    username?: string | null;
  } = {};

  if (fields.name !== undefined) {
    data.name = fields.name.trim();
  }

  if (fields.private !== undefined) {
    data.private = fields.private;
  }

  if (fields.username !== undefined) {
    data.username = fields.username.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return true;
  }

  try {
    await prisma.playlist.update({
      where: playlistWhere(userId, playlistId),
      data,
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
};

export const deletePlaylist = async (
  userId: number,
  playlistId: string,
): Promise<boolean> => {
  try {
    await prisma.playlist.delete({
      where: playlistWhere(userId, playlistId),
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
};

export type AddTrackToPlaylistResult =
  | { created: true; sort_order: number }
  | { created: false; reason: "duplicate" }
  | { created: false; reason: "playlist_not_found" };

export const addTrackToPlaylist = async (
  userId: number,
  playlistId: string,
  metadata: UserTrackMetadataBody,
): Promise<AddTrackToPlaylistResult> => {
  const playlist = await prisma.playlist.findUnique({
    where: playlistWhere(userId, playlistId),
    select: { id: true },
  });

  if (!playlist) {
    return { created: false, reason: "playlist_not_found" };
  }

  await ensureUserTrackMetadata(userId, metadata);

  const existing = await prisma.playlistTrack.findUnique({
    where: playlistTrackWhere(userId, playlistId, metadata.track_key),
    select: { track_key: true },
  });

  if (existing) {
    return { created: false, reason: "duplicate" };
  }

  const aggregate = await prisma.playlistTrack.aggregate({
    where: { user_id: userId, playlist_id: playlistId },
    _max: { sort_order: true },
  });
  const nextSortOrder = (aggregate._max.sort_order ?? 0) + 1;

  try {
    await prisma.playlistTrack.create({
      data: {
        user_id: userId,
        playlist_id: playlistId,
        track_key: metadata.track_key,
        sort_order: nextSortOrder,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { created: false, reason: "duplicate" };
    }
    throw error;
  }

  await prisma.playlist.update({
    where: playlistWhere(userId, playlistId),
    data: { updated_at: new Date() },
  });

  return { created: true, sort_order: nextSortOrder };
};

export const removeTrackFromPlaylist = async (
  userId: number,
  playlistId: string,
  trackKey: string,
): Promise<boolean> => {
  try {
    await prisma.playlistTrack.delete({
      where: playlistTrackWhere(userId, playlistId, trackKey),
    });
    await prisma.playlist.update({
      where: playlistWhere(userId, playlistId),
      data: { updated_at: new Date() },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return false;
    }
    throw error;
  }
};

export const reorderPlaylistTracks = async (
  userId: number,
  playlistId: string,
  trackKeysInOrder: string[],
): Promise<boolean> => {
  const playlist = await prisma.playlist.findUnique({
    where: playlistWhere(userId, playlistId),
    select: { id: true },
  });

  if (!playlist) {
    return false;
  }

  const existing = await prisma.playlistTrack.findMany({
    where: { user_id: userId, playlist_id: playlistId },
    select: { track_key: true },
  });

  const existingKeys = new Set(existing.map((row) => row.track_key));
  if (
    new Set(trackKeysInOrder).size !== trackKeysInOrder.length ||
    trackKeysInOrder.length !== existingKeys.size ||
    trackKeysInOrder.some((key) => !existingKeys.has(key))
  ) {
    return false;
  }

  await prisma.$transaction([
    ...trackKeysInOrder.map((trackKey, index) =>
      prisma.playlistTrack.update({
        where: playlistTrackWhere(userId, playlistId, trackKey),
        data: { sort_order: index + 1 },
      }),
    ),
    prisma.playlist.update({
      where: playlistWhere(userId, playlistId),
      data: { updated_at: new Date() },
    }),
  ]);

  return true;
};
