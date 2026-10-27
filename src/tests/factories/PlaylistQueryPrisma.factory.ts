import { faker } from "@faker-js/faker";
import type { Prisma } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { KeysMatch } from "src/types/KeysMatch";

export type PlaylistIdRow = Prisma.PlaylistGetPayload<{
  select: { id: true };
}>;

export type PlaylistEngagementSelectRow = Prisma.PlaylistGetPayload<{
  select: { public_view_count: true; public_play_count: true };
}>;

export type PlaylistTrackMaxSortOrderAggregate =
  Prisma.GetPlaylistTrackAggregateType<{
    _max: { sort_order: true };
  }>;

export type PlaylistListFindManyRow = Prisma.PlaylistGetPayload<{
  select: {
    id: true;
    name: true;
    private: true;
    public_view_count: true;
    public_play_count: true;
    created_at: true;
    updated_at: true;
    _count: { select: { tracks: true } };
  };
}>;

export type PlaylistListFindManyWithTrackKeyRow = Prisma.PlaylistGetPayload<{
  select: {
    id: true;
    name: true;
    private: true;
    public_view_count: true;
    public_play_count: true;
    created_at: true;
    updated_at: true;
    _count: { select: { tracks: true } };
    tracks: { select: { track_key: true } };
  };
}>;

export type PlaylistDetailFindUniqueRow = Prisma.PlaylistGetPayload<{
  select: {
    id: true;
    name: true;
    private: true;
    public_view_count: true;
    public_play_count: true;
    public_description: true;
    created_at: true;
    updated_at: true;
    tracks: {
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
    };
  };
}>;

export type PlaylistTrackKeyOnlyRow = Prisma.PlaylistTrackGetPayload<{
  select: { track_key: true };
}>;

type PlaylistQueryPrismaFactoryOptions = Record<string, never>;

class PlaylistIdRowFactory extends BaseFactory<
  PlaylistIdRow,
  PlaylistQueryPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistIdRow>,
    _options?: PlaylistQueryPrismaFactoryOptions,
  ): PlaylistIdRow {
    const instance: PlaylistIdRow = {
      id: faker.string.uuid(),
    };

    return mergeFactoryAttributes(instance, attributes);
  }
}

class PlaylistEngagementSelectRowFactory extends BaseFactory<
  PlaylistEngagementSelectRow,
  PlaylistQueryPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistEngagementSelectRow>,
    _options?: PlaylistQueryPrismaFactoryOptions,
  ): PlaylistEngagementSelectRow {
    const instance: PlaylistEngagementSelectRow = {
      public_view_count: 0,
      public_play_count: 0,
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistEngagementSelectRow,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

class PlaylistTrackMaxSortOrderAggregateFactory extends BaseFactory<
  PlaylistTrackMaxSortOrderAggregate,
  PlaylistQueryPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistTrackMaxSortOrderAggregate>,
    _options?: PlaylistQueryPrismaFactoryOptions,
  ): PlaylistTrackMaxSortOrderAggregate {
    const instance: PlaylistTrackMaxSortOrderAggregate = {
      _max: { sort_order: null },
    };

    return mergeFactoryAttributes(instance, attributes);
  }
}

class PlaylistDetailFindUniqueRowFactory extends BaseFactory<
  PlaylistDetailFindUniqueRow,
  PlaylistQueryPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistDetailFindUniqueRow>,
    _options?: PlaylistQueryPrismaFactoryOptions,
  ): PlaylistDetailFindUniqueRow {
    const created = faker.date.past();
    const updated = faker.date.between({ from: created, to: new Date() });

    const instance: PlaylistDetailFindUniqueRow = {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement(["Sunday", "Public mix"]),
      private: false,
      public_view_count: 0,
      public_play_count: 0,
      public_description: null,
      created_at: created,
      updated_at: updated,
      tracks: [],
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistDetailFindUniqueRow,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

class PlaylistTrackKeyOnlyRowFactory extends BaseFactory<
  PlaylistTrackKeyOnlyRow,
  PlaylistQueryPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistTrackKeyOnlyRow>,
    _options?: PlaylistQueryPrismaFactoryOptions,
  ): PlaylistTrackKeyOnlyRow {
    const instance: PlaylistTrackKeyOnlyRow = {
      track_key: `${faker.string.numeric(4)}:A1`,
    };

    return mergeFactoryAttributes(instance, attributes);
  }
}

export const playlistIdRowFactory = new PlaylistIdRowFactory();
export const playlistEngagementSelectRowFactory =
  new PlaylistEngagementSelectRowFactory();
export const playlistTrackMaxSortOrderAggregateFactory =
  new PlaylistTrackMaxSortOrderAggregateFactory();
export const playlistDetailFindUniqueRowFactory =
  new PlaylistDetailFindUniqueRowFactory();
export const playlistTrackKeyOnlyRowFactory =
  new PlaylistTrackKeyOnlyRowFactory();
