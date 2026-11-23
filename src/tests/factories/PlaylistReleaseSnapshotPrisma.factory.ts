import { faker } from "@faker-js/faker";
import type { PlaylistReleaseSnapshot, Prisma } from "@prisma/client";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type { DiscogsRelease } from "src/types";
import type { KeysMatch } from "src/types/KeysMatch";
import { toPrismaJsonValue } from "src/utils/toPrismaJsonValue";

export type PlaylistReleaseSnapshotFindManyRow =
  Prisma.PlaylistReleaseSnapshotGetPayload<{
    select: { instance_id: true; release_data: true };
  }>;

type PlaylistReleaseSnapshotPrismaFactoryOptions = Record<string, never>;

class PlaylistReleaseSnapshotFindManyRowFactory extends BaseFactory<
  PlaylistReleaseSnapshotFindManyRow,
  PlaylistReleaseSnapshotPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistReleaseSnapshotFindManyRow>,
    _options?: PlaylistReleaseSnapshotPrismaFactoryOptions,
  ): PlaylistReleaseSnapshotFindManyRow {
    const instance: PlaylistReleaseSnapshotFindManyRow = {
      instance_id: faker.string.numeric(4),
      release_data: toPrismaJsonValue({}),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistReleaseSnapshotFindManyRow,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }

  fromDiscogsRelease(
    release: DiscogsRelease,
    attributes?: Partial<PlaylistReleaseSnapshotFindManyRow>,
  ): PlaylistReleaseSnapshotFindManyRow {
    return this.build({
      instance_id: String(release.instance_id),
      release_data: toPrismaJsonValue(release),
      ...attributes,
    });
  }
}

class PlaylistReleaseSnapshotUpsertResultFactory extends BaseFactory<
  PlaylistReleaseSnapshot,
  PlaylistReleaseSnapshotPrismaFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistReleaseSnapshot>,
    _options?: PlaylistReleaseSnapshotPrismaFactoryOptions,
  ): PlaylistReleaseSnapshot {
    const instance: PlaylistReleaseSnapshot = {
      user_id: faker.number.int({ min: 1, max: 9999 }),
      playlist_id: faker.string.uuid(),
      instance_id: faker.string.numeric(4),
      release_data: toPrismaJsonValue({}),
      updated_at: faker.date.recent(),
    };

    const factoryBuilt = mergeFactoryAttributes(instance, attributes);

    const _allKeysMustBeInTheInstance: KeysMatch<
      PlaylistReleaseSnapshot,
      typeof instance
    > = undefined;

    return factoryBuilt;
  }
}

export const playlistReleaseSnapshotFindManyRowFactory =
  new PlaylistReleaseSnapshotFindManyRowFactory();

export const playlistReleaseSnapshotUpsertResultFactory =
  new PlaylistReleaseSnapshotUpsertResultFactory();
