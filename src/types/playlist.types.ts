export type PlaylistSummary = {
  id: string;
  name: string;
  trackCount: number;
  created_at: string;
  updated_at: string;
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
};

export type PlaylistDetail = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  tracks: PlaylistTrackRow[];
};
