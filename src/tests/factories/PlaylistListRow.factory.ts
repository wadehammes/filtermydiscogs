import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";
import type {
  PlaylistListFindManyRow,
  PlaylistListFindManyWithTrackKeyRow,
} from "src/tests/factories/PlaylistQueryPrisma.factory";

export type PlaylistListQueryRow = PlaylistListFindManyRow;

type PlaylistListRowFactoryOptions = Record<string, never>;

class PlaylistListRowFactory extends BaseFactory<
  PlaylistListQueryRow,
  PlaylistListRowFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistListQueryRow>,
    _options?: PlaylistListRowFactoryOptions,
  ): PlaylistListQueryRow {
    const created = faker.date.past();

    const instance: PlaylistListQueryRow = {
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Sunday spins",
        "Late night",
        faker.word.noun(),
      ]),
      private: true,
      public_view_count: 0,
      public_play_count: 0,
      created_at: created,
      updated_at: faker.date.between({ from: created, to: new Date() }),
      _count: { tracks: faker.number.int({ min: 0, max: 40 }) },
    };

    return mergeFactoryAttributes(instance, attributes);
  }

  withTrackKeyProbe(
    attributes: Partial<PlaylistListFindManyWithTrackKeyRow> = {},
  ): PlaylistListFindManyWithTrackKeyRow {
    const base = this.forListTest(attributes);

    const emptyTracks: PlaylistListFindManyWithTrackKeyRow["tracks"] = [];

    return mergeFactoryAttributes(
      {
        ...base,
        tracks: emptyTracks,
      },
      attributes,
    );
  }

  forListTest(
    attributes: Partial<PlaylistListQueryRow> = {},
  ): PlaylistListQueryRow {
    return this.build({
      id: "playlist-uuid",
      name: "Sunday",
      created_at: new Date("2026-10-01T00:00:00.000Z"),
      updated_at: new Date("2026-10-02T00:00:00.000Z"),
      _count: { tracks: 2 },
      ...attributes,
    });
  }
}

export const playlistListRowFactory = new PlaylistListRowFactory();
