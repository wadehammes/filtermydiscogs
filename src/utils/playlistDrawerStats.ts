import type { PlaylistDetail } from "src/types/playlist.types";

export type PlaylistDrawerStatEntryId =
  | "views"
  | "plays"
  | "upvotes"
  | "downvotes";

export type PlaylistDrawerStatsSnapshot = {
  isPublic: boolean;
  publicViewCount: number;
  publicPlayCount: number;
  totalUpVotes: number;
  totalDownVotes: number;
};

export type PlaylistDrawerStatEntry = {
  id: PlaylistDrawerStatEntryId;
  label: string;
  value: string;
};

export const buildPlaylistDrawerStatsFromDetail = (
  playlist: PlaylistDetail,
): PlaylistDrawerStatsSnapshot => ({
  isPublic: playlist.private === false,
  publicViewCount: playlist.publicViewCount ?? 0,
  publicPlayCount: playlist.publicPlayCount ?? 0,
  totalUpVotes: playlist.tracks.reduce((sum, track) => sum + track.upCount, 0),
  totalDownVotes: playlist.tracks.reduce(
    (sum, track) => sum + track.downCount,
    0,
  ),
});

export const listPlaylistDrawerStatEntries = (
  snapshot: PlaylistDrawerStatsSnapshot,
): PlaylistDrawerStatEntry[] => {
  const entries: PlaylistDrawerStatEntry[] = [];

  if (snapshot.isPublic) {
    entries.push(
      {
        id: "views",
        label: "Views",
        value: snapshot.publicViewCount.toLocaleString(),
      },
      {
        id: "plays",
        label: "Plays",
        value: snapshot.publicPlayCount.toLocaleString(),
      },
    );
  }

  const showVoteTotals =
    snapshot.isPublic ||
    snapshot.totalUpVotes > 0 ||
    snapshot.totalDownVotes > 0;

  if (showVoteTotals) {
    entries.push(
      {
        id: "upvotes",
        label: "Upvotes",
        value: snapshot.totalUpVotes.toLocaleString(),
      },
      {
        id: "downvotes",
        label: "Downvotes",
        value: snapshot.totalDownVotes.toLocaleString(),
      },
    );
  }

  return entries;
};

export const listPlaylistDrawerStatEntriesFromDetail = (
  playlist: PlaylistDetail,
): PlaylistDrawerStatEntry[] =>
  listPlaylistDrawerStatEntries(buildPlaylistDrawerStatsFromDetail(playlist));
