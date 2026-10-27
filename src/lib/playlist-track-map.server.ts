import type { PlaylistTrackRow } from "src/types/playlist.types";

export const mapPlaylistTrackRow = (row: {
  sort_order: number;
  track_key: string;
  up_count: number;
  down_count: number;
  user_track: {
    track_title: string;
    track_position: string;
    instance_id: string;
    artist: string | null;
    release_title: string | null;
    youtube_id: string | null;
    discogs_release_id: number | null;
  };
}): PlaylistTrackRow => ({
  track_key: row.track_key,
  sort_order: row.sort_order,
  track_title: row.user_track.track_title,
  track_position: row.user_track.track_position,
  instance_id: row.user_track.instance_id,
  artist: row.user_track.artist,
  release_title: row.user_track.release_title,
  youtube_id: row.user_track.youtube_id,
  discogs_release_id: row.user_track.discogs_release_id,
  upCount: row.up_count ?? 0,
  downCount: row.down_count ?? 0,
});
