import { calculateOptimalGrid, MOSAIC_CONSTANTS } from "src/constants/mosaic";
import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import {
  resolvePlaylistTrackReleaseImageUrl,
  resolveReleaseDisplayImageUrl,
} from "src/utils/releaseAlbumCover";

export const PLAYLIST_MOSAIC_MAX_TILES = 49;

export const PLAYLIST_HERO_MOSAIC_MAX_TILES = 4;

export const uniqueInstanceIdsInPlaylistOrder = (
  tracks: PlaylistTrackRow[],
): string[] => {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const track of tracks) {
    const instanceId = String(track.instance_id);
    if (seen.has(instanceId)) {
      continue;
    }
    seen.add(instanceId);
    ordered.push(instanceId);
  }

  return ordered;
};

export const resolvePlaylistTrackThumbUrl = (
  _track: PlaylistTrackRow,
  release: DiscogsRelease | undefined,
): string => resolvePlaylistTrackReleaseImageUrl(release);

export const buildPlaylistMosaicThumbUrls = ({
  tracks,
  releaseByInstanceId,
  maxTiles = PLAYLIST_MOSAIC_MAX_TILES,
}: {
  tracks: PlaylistTrackRow[];
  releaseByInstanceId: Map<string, DiscogsRelease>;
  maxTiles?: number;
}): string[] => {
  const instanceIds = uniqueInstanceIdsInPlaylistOrder(tracks).slice(
    0,
    maxTiles,
  );
  const urls: string[] = [];

  for (const instanceId of instanceIds) {
    const track = tracks.find((row) => String(row.instance_id) === instanceId);
    const release = releaseByInstanceId.get(instanceId);
    const thumb = track
      ? resolvePlaylistTrackThumbUrl(track, release)
      : release
        ? resolveReleaseDisplayImageUrl(release)
        : "";

    if (thumb && !thumb.startsWith("data:")) {
      urls.push(thumb);
    }
  }

  return urls;
};

export const playlistMosaicGridLayout = (tileCount: number) =>
  calculateOptimalGrid(tileCount, MOSAIC_CONSTANTS.ASPECT_RATIOS.SQUARE);
