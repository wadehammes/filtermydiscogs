import type { PlaylistDetail } from "src/types/playlist.types";

export const applyPlaylistTrackOrder = (
  playlist: PlaylistDetail,
  trackKeys: string[],
): PlaylistDetail => {
  const trackByKey = new Map(
    playlist.tracks.map((track) => [track.track_key, track]),
  );
  const tracks = trackKeys.flatMap((trackKey, index) => {
    const track = trackByKey.get(trackKey);

    if (!track) {
      return [];
    }

    return [{ ...track, sort_order: index }];
  });

  return { ...playlist, tracks };
};
