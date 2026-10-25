import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import { definedProps } from "src/utils/definedProps";

export const buildStubReleaseForPlaylistTrack = (
  track: PlaylistTrackRow,
): DiscogsRelease | null => {
  const youtubeId = track.youtube_id?.trim();
  if (!youtubeId) {
    return null;
  }

  const title = track.release_title?.trim() || track.track_title;
  const artists = track.artist?.trim() ? [{ name: track.artist.trim() }] : [];
  return {
    instance_id: String(track.instance_id),
    date_added: new Date().toISOString(),
    rating: 0,
    basic_information: {
      title,
      artists,
      labels: [],
      year: 0,
      styles: [],
      formats: [],
      thumb: "",
      cover_image: "",
      resource_url: "",
      uri: "",
      master_id: 0,
      master_url: null,
      ...definedProps({
        id:
          track.discogs_release_id !== null
            ? track.discogs_release_id
            : undefined,
      }),
    },
  };
};
