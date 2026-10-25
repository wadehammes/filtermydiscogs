import type { DiscogsRelease } from "src/types";

export type PlaylistSummary = {
  id: string;
  name: string;
  trackCount: number;
  created_at: string;
  updated_at: string;
  private?: boolean;
  containsTrack?: boolean;
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
};

export type PlaylistDetail = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  private?: boolean;
  tracks: PlaylistTrackRow[];
};

export type PublicPlaylistInfo = {
  id: string;
  name: string;
  username: string | null;
  private: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicPlaylistResponse = {
  playlist: PublicPlaylistInfo;
  tracks: PlaylistTrackRow[];
  releases: DiscogsRelease[];
  mosaicThumbUrls: string[];
};
