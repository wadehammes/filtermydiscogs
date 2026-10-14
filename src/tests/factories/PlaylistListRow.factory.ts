import { faker } from "@faker-js/faker";
import { BaseFactory } from "src/tests/factories/BaseFactory";
import { mergeFactoryAttributes } from "src/tests/factories/mergeFactoryAttributes";

export type PlaylistListQueryRow = {
  user_id: number;
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  _count: { tracks: number };
};

type PlaylistListRowFactoryOptions = {
  userId?: number;
};

class PlaylistListRowFactory extends BaseFactory<
  PlaylistListQueryRow,
  PlaylistListRowFactoryOptions
> {
  build(
    attributes?: Partial<PlaylistListQueryRow>,
    options?: PlaylistListRowFactoryOptions,
  ): PlaylistListQueryRow {
    const userId =
      options?.userId ?? faker.number.int({ min: 1, max: 999_999 });
    const created = faker.date.past();

    const instance: PlaylistListQueryRow = {
      user_id: userId,
      id: faker.string.uuid(),
      name: faker.helpers.arrayElement([
        "Sunday spins",
        "Late night",
        faker.word.noun(),
      ]),
      created_at: created,
      updated_at: faker.date.between({ from: created, to: new Date() }),
      _count: { tracks: faker.number.int({ min: 0, max: 40 }) },
    };

    return mergeFactoryAttributes(instance, attributes);
  }

  forListTest(
    attributes: Partial<PlaylistListQueryRow> = {},
    options?: PlaylistListRowFactoryOptions,
  ): PlaylistListQueryRow {
    return this.build(
      {
        id: "playlist-uuid",
        name: "Sunday",
        created_at: new Date("2026-10-01T00:00:00.000Z"),
        updated_at: new Date("2026-10-02T00:00:00.000Z"),
        _count: { tracks: 2 },
        ...attributes,
      },
      options,
    );
  }
}

export const playlistListRowFactory = new PlaylistListRowFactory();
