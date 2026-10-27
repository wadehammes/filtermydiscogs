import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { publicPlaylistInfoFactory } from "src/tests/factories/PublicPlaylistInfo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { PublicPlaylistResponse } from "src/types/playlist.types";

class PublicPlaylistResponseFactory extends BaseFactory<
  PublicPlaylistResponse,
  Record<string, never>
> {
  build(attributes?: Partial<PublicPlaylistResponse>): PublicPlaylistResponse {
    const releases = releaseFactory.buildList(2);
    const tracks = releases.map((release, index) =>
      playlistTrackRowFactory.build({
        instance_id: String(release.instance_id),
        track_key: `${release.instance_id}:A1`,
        sort_order: (index + 1) * 10,
      }),
    );
    const detail = playlistDetailFactory.withTracks(tracks);

    const instance: PublicPlaylistResponse = {
      playlist: publicPlaylistInfoFactory.build({
        id: detail.id,
        name: detail.name,
        created_at: detail.created_at,
        updated_at: detail.updated_at,
      }),
      tracks: detail.tracks,
      releases,
      mosaicThumbUrls: releases
        .map((release) => release.basic_information.thumb)
        .filter(Boolean),
      shareStats: {
        publicViewCount: 0,
        publicPlayCount: 0,
      },
    };

    return mergeFactoryAttributes(instance, attributes);
  }
}

export const publicPlaylistResponseFactory =
  new PublicPlaylistResponseFactory();
