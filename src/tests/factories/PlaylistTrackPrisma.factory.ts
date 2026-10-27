import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";
import type { PlaylistTrackRow } from "src/types/playlist.types";

export type PlaylistTrackVoteCountsRow = Prisma.PlaylistTrackGetPayload<{
  select: { up_count: true; down_count: true };
}>;

export type PlaylistTrackCreateResultRow = Prisma.PlaylistTrackGetPayload<{
  select: {
    user_id: true;
    playlist_id: true;
    track_key: true;
    sort_order: true;
    up_count: true;
    down_count: true;
  };
}>;

type PlaylistTrackPrismaFactoryOptions = Record<string, never>;

class PlaylistTrackVoteCountsRowFactory extends BaseFactory<
  PlaylistTrackVoteCountsRow,
  PlaylistTrackPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistTrackVoteCountsRow>,
    _options?: PlaylistTrackPrismaFactoryOptions,
  ): PlaylistTrackVoteCountsRow {
    const instance: PlaylistTrackVoteCountsRow = {
      up_count: 0,
      down_count: 0,
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistTrackVoteCountsRow,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

class PlaylistTrackCreateResultRowFactory extends BaseFactory<
  PlaylistTrackCreateResultRow,
  PlaylistTrackPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistTrackCreateResultRow>,
    _options?: PlaylistTrackPrismaFactoryOptions,
  ): PlaylistTrackCreateResultRow {
    const instance: PlaylistTrackCreateResultRow = {
      user_id: faker.number.int({ min: 1, max: 9999 }),
      playlist_id: faker.string.uuid(),
      track_key: `${faker.string.numeric(4)}:A1`,
      sort_order: faker.number.int({ min: 1, max: 50 }),
      up_count: 0,
      down_count: 0,
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistTrackCreateResultRow,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  fromTrackMetadata(
    userId: number,
    playlistId: string,
    trackKey: string,
    sortOrder: number,
    attributes: Partial<PlaylistTrackCreateResultRow> = {},
  ): PlaylistTrackCreateResultRow {
    return this.build({
      user_id: userId,
      playlist_id: playlistId,
      track_key: trackKey,
      sort_order: sortOrder,
      ...attributes,
    });
  }
}

export type PlaylistDetailTrackJoinRow = Prisma.PlaylistTrackGetPayload<{
  select: {
    sort_order: true;
    track_key: true;
    up_count: true;
    down_count: true;
    user_track: {
      select: {
        track_title: true;
        track_position: true;
        instance_id: true;
        artist: true;
        release_title: true;
        youtube_id: true;
        discogs_release_id: true;
      };
    };
  };
}>;

export const playlistTrackVoteCountsRowFactory =
  new PlaylistTrackVoteCountsRowFactory();

export const playlistTrackCreateResultRowFactory =
  new PlaylistTrackCreateResultRowFactory();

export const playlistDetailTrackJoinRowFromDomain = (
  track: PlaylistTrackRow,
): PlaylistDetailTrackJoinRow => ({
  sort_order: track.sort_order,
  track_key: track.track_key,
  up_count: track.upCount,
  down_count: track.downCount,
  user_track: {
    track_title: track.track_title,
    track_position: track.track_position,
    instance_id: track.instance_id,
    artist: track.artist,
    release_title: track.release_title,
    youtube_id: track.youtube_id,
    discogs_release_id: track.discogs_release_id,
  },
});
