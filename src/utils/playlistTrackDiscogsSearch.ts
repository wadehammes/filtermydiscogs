import type { DiscogsSearchResponse } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";

export const buildPlaylistTrackDiscogsSearchQuery = (
  track: Pick<PlaylistTrackRow, "artist" | "release_title">,
): string | null => {
  const artist = track.artist?.trim();
  const releaseTitle = track.release_title?.trim();

  if (artist && releaseTitle) {
    return `${artist} ${releaseTitle}`;
  }

  if (releaseTitle) {
    return releaseTitle;
  }

  return null;
};

export const resolveDiscogsReleaseIdFromSearchResponse = (
  response: DiscogsSearchResponse | null | undefined,
): number | null => {
  const match = response?.results?.find(
    (result) => result.type === "release" && result.id > 0,
  );

  return match?.id ?? null;
};
