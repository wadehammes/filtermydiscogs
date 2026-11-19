import type { DiscogsRelease } from "src/types";
import type { PlaylistTrackRow } from "src/types/playlist.types";
import {
  buildPlaylistMosaicThumbUrls,
  PLAYLIST_HERO_MOSAIC_MAX_TILES,
} from "src/utils/playlistMosaic";

export const resolvePublicPlaylistHeroThumbUrls = ({
  mosaicThumbUrls,
  tracks,
  releaseByInstanceId,
  maxTiles = PLAYLIST_HERO_MOSAIC_MAX_TILES,
}: {
  mosaicThumbUrls?: string[] | undefined;
  tracks: PlaylistTrackRow[];
  releaseByInstanceId: Map<string, DiscogsRelease>;
  maxTiles?: number;
}): string[] => {
  const fromServer = (mosaicThumbUrls ?? [])
    .slice(0, maxTiles)
    .filter((url) => url.length > 0);

  if (fromServer.length > 0) {
    return fromServer;
  }

  return buildPlaylistMosaicThumbUrls({
    tracks,
    releaseByInstanceId,
    maxTiles,
  });
};
