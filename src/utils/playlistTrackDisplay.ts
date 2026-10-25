import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";

export const resolvePlaylistTrackReleaseMetaLine = (
  track: Pick<PlaylistTrackRow, "release_title">,
  release: DiscogsRelease | null,
): string => {
  const catno = release?.basic_information.labels[0]?.catno?.trim();

  if (catno) {
    return catno;
  }

  return track.release_title?.trim() ?? "";
};
