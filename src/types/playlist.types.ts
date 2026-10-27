import type { PlaylistTrackVoteDirection } from "src/constants/playlistTrackVote.constants";
import type { DiscogsRelease } from "src/types";

export type { PlaylistTrackVoteDirection };

export type PublicPlaylistShareStats = {
  publicViewCount: number;
  publicPlayCount: number;
};

export type PublicPlaylistEngagementResponse = {
  ok: true;
  shareStats: PublicPlaylistShareStats;
  deduped?: boolean;
};

export type PlaylistSummary = {
  id: string;
  name: string;
  trackCount: number;
  created_at: string;
  updated_at: string;
  private?: boolean;
  containsTrack?: boolean;
  publicViewCount?: number;
  publicPlayCount?: number;
};

export type PlaylistTrackVoteCounts = {
  upCount: number;
  downCount: number;
};

export type PlaylistTrackRow = {
  track_key: string;
  sort_order: number;
  track_title: string;
  track_position: string;
  instance_id: string;
  artist: string | null;
  release_title: string | null;
  youtube_id: string | null;
  discogs_release_id: number | null;
  upCount: number;
  downCount: number;
  viewerVote?: PlaylistTrackVoteDirection | null;
};

export type PlaylistTrackVoteResponse = {
  ok: true;
  track_key: string;
  upCount: number;
  downCount: number;
  viewerVote: PlaylistTrackVoteDirection | null;
};

export type PlaylistDetail = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  private?: boolean;
  publicDescription?: string | null;
  publicViewCount?: number;
  publicPlayCount?: number;
  tracks: PlaylistTrackRow[];
};

export type PublicPlaylistInfo = {
  id: string;
  name: string;
  username: string | null;
  private: boolean;
  publicDescription: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicPlaylistResponse = {
  playlist: PublicPlaylistInfo;
  shareStats: PublicPlaylistShareStats;
  tracks: PlaylistTrackRow[];
  releases: DiscogsRelease[];
  mosaicThumbUrls: string[];
  viewerIsOwner?: boolean;
};
